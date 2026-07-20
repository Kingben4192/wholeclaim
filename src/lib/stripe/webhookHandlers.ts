import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIFETIME_ENTITLEMENT_TYPES } from "@/lib/entitlements";

// Stripe webhook event handling (Billing Build Order Step 3). Every
// function here takes a service-role Supabase client (RLS-bypassing,
// matching the existing webhook route's use of getAdminClient()) and
// writes only the fields described in its own comment. Idempotency
// (processed_stripe_events) lives in route.ts, one layer up — this file
// assumes it's only ever called once per genuinely-new event.

function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

// current_period_end moved from the top-level Subscription object to the
// subscription item in the Stripe API version this SDK (stripe 22.3.1)
// targets — read it from the item first, with a defensive fallback to the
// old top-level field in case the connected account is pinned to an older
// API version than the SDK's types assume.
function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  const itemLevel = subscription.items?.data?.[0]?.current_period_end;
  if (typeof itemLevel === "number") return itemLevel;
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end;
  return typeof legacy === "number" ? legacy : null;
}

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function paymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

// ---------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------

async function handleCheckoutSessionCompletedSubscription(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  // $19/month purchase. DB change: profiles.plan -> 'pro' (kept in sync as
  // a cached/derived field even though every Pro tool gate now reads
  // isPro() instead, as of Billing Build Order Step 5), stripe_customer_id,
  // stripe_subscription_id.
  // subscription_status / subscription_current_period_end are NOT set
  // here — they aren't reliably present on the Checkout Session payload
  // without an extra API call, and land moments later via
  // customer.subscription.created, which carries the full Subscription
  // object for free. That event's handler is the single place those two
  // fields get written.
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  if (!userId) {
    console.error(
      `webhook checkout.session.completed (subscription): no user_id in metadata or client_reference_id — skipping. session=${session.id}`,
    );
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "pro",
      stripe_customer_id: customerId(session.customer),
      stripe_subscription_id: subscriptionId,
    })
    .eq("id", userId);
  if (error) {
    console.error("webhook checkout.session.completed (subscription): profiles update failed:", error.message);
  }
}

async function handleCheckoutSessionCompletedPayment(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  // $49 lifetime claim unlock. DB change: insert one claim_entitlements
  // row. claim_id MUST come from metadata — never guessed, never derived
  // from anything else. Deliberately does NOT touch profiles.plan: a
  // lifetime unlock is claim-scoped, not account-wide, unlike a
  // subscription. Until a later step moves Pro tools onto isPro(), a
  // lifetime purchaser won't see any feature unlock yet — expected given
  // the phased build order, not a defect in this step.
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const claimId = session.metadata?.claim_id ?? null;

  if (!userId || !claimId) {
    console.error(
      `webhook checkout.session.completed (payment): missing required metadata (user_id=${userId ?? "null"}, claim_id=${claimId ?? "null"}) — refusing to guess, no entitlement granted. session=${session.id}`,
    );
    return;
  }

  const { error } = await supabase.from("claim_entitlements").insert({
    claim_id: claimId,
    user_id: userId,
    entitlement_type: "lifetime_claim_unlock",
    status: "active",
    stripe_payment_id: paymentIntentId(session.payment_intent),
    stripe_customer_id: customerId(session.customer),
    purchased_at: new Date().toISOString(),
  });
  if (error) {
    // The partial unique index on stripe_payment_id (0011 migration)
    // makes a duplicate insert for the same payment fail here rather than
    // create a second grant — logged, not thrown, so a redelivered event
    // doesn't crash the webhook.
    console.error("webhook checkout.session.completed (payment): claim_entitlements insert failed:", error.message);
  }
}

export async function handleCheckoutSessionCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  if (session.mode === "subscription") {
    return handleCheckoutSessionCompletedSubscription(supabase, session);
  }
  if (session.mode === "payment") {
    return handleCheckoutSessionCompletedPayment(supabase, session);
  }
  console.error(`webhook checkout.session.completed: unrecognized mode "${session.mode}", no action taken.`);
}

// ---------------------------------------------------------------------
// customer.subscription.created / customer.subscription.updated
// ---------------------------------------------------------------------

export async function handleSubscriptionSync(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  // DB change: profiles.stripe_subscription_id, subscription_status,
  // subscription_current_period_end. Shared by created and updated —
  // both just sync Stripe's current truth onto profiles; neither touches
  // `plan` (checkout.session.completed grants it, deleted/refund/dispute
  // revoke it — created/updated are pure state-sync, not grant/revoke
  // events).
  //
  // Looked up by stripe_customer_id, not a metadata user_id — Checkout
  // doesn't currently set subscription_data.metadata (out of scope to add
  // in this step), so this relies on checkout.session.completed having
  // already set stripe_customer_id for this customer. Stripe doesn't
  // guarantee event delivery order; if this event arrives first, the
  // update matches zero rows rather than erroring. Narrow edge case,
  // flagged rather than solved here.
  const custId = customerId(subscription.customer);
  if (!custId) {
    console.error("webhook subscription sync: no customer id on subscription", subscription.id);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: toIso(getCurrentPeriodEnd(subscription)),
    })
    .eq("stripe_customer_id", custId);
  if (error) console.error("webhook subscription sync: profiles update failed:", error.message);
}

// ---------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------

export async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  // Cancellation. DB change: profiles.plan -> 'free', subscription_status
  // -> 'canceled'. Deliberately does not touch claim_entitlements — a
  // lifetime unlock is independent of any subscription and must be
  // unaffected by this event.
  const custId = customerId(subscription.customer);
  if (!custId) {
    console.error("webhook customer.subscription.deleted: no customer id on subscription", subscription.id);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan: "free", subscription_status: "canceled" })
    .eq("stripe_customer_id", custId);
  if (error) console.error("webhook customer.subscription.deleted: profiles update failed:", error.message);
}

// ---------------------------------------------------------------------
// invoice.payment_failed
// ---------------------------------------------------------------------

export async function handleInvoicePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  // Decision #33: a failed payment moves the account into a grace period,
  // not an immediate downgrade. DB change: profiles.subscription_status
  // -> 'past_due' only. plan is deliberately left untouched (stays 'pro')
  // — isPro() itself now treats 'past_due' as Pro (entitlements.ts), so
  // this is the one place that state gets set; nothing here revokes
  // access.
  const custId = customerId((invoice as unknown as { customer: string | Stripe.Customer | Stripe.DeletedCustomer | null }).customer);
  if (!custId) {
    console.error("webhook invoice.payment_failed: no customer id on invoice", invoice.id);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("stripe_customer_id", custId);
  if (error) console.error("webhook invoice.payment_failed: profiles update failed:", error.message);
}

// ---------------------------------------------------------------------
// charge.refunded / charge.dispute.created — shared lifetime-entitlement
// revocation, then a subscription-downgrade fallback if the payment
// wasn't a lifetime purchase.
// ---------------------------------------------------------------------

async function revokeLifetimeEntitlementByPaymentIntent(
  supabase: SupabaseClient,
  intentId: string | null,
): Promise<boolean> {
  // "Money taken back" events get the same treatment for a lifetime
  // purchase: status flips to 'revoked', the row is never deleted
  // (Decision #31 — preserves the audit trail; a refunded claim can't be
  // silently repurchased as fresh-free since the row still exists as
  // evidence). Only touches currently-'active' rows of a lifetime type.
  if (!intentId) return false;

  const { data, error } = await supabase
    .from("claim_entitlements")
    .update({ status: "revoked" })
    .eq("stripe_payment_id", intentId)
    .eq("status", "active")
    .in("entitlement_type", LIFETIME_ENTITLEMENT_TYPES)
    .select("id");

  if (error) {
    console.error("webhook: revoking claim_entitlements by payment_intent failed:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function downgradeSubscriptionForCustomer(
  supabase: SupabaseClient,
  custId: string | null,
  status: string,
) {
  if (!custId) {
    console.error("webhook: subscription downgrade requested with no customer id — skipping.");
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "free", subscription_status: status })
    .eq("stripe_customer_id", custId);
  if (error) console.error("webhook: subscription downgrade failed:", error.message);
}

export async function handleChargeRefunded(supabase: SupabaseClient, charge: Stripe.Charge) {
  // DB change: EITHER claim_entitlements.status -> 'revoked' (lifetime
  // purchase) OR profiles downgraded (subscription-related refund) —
  // never both, determined by whether the payment_intent matches a
  // lifetime entitlement row.
  const revokedLifetime = await revokeLifetimeEntitlementByPaymentIntent(
    supabase,
    paymentIntentId(charge.payment_intent),
  );
  if (revokedLifetime) return;

  // Not a lifetime purchase — treat as a subscription-related refund.
  // Judgment call: treated as equivalent to immediate cancellation, not a
  // prorated/partial adjustment — flagged for review, not a designed
  // nuance.
  await downgradeSubscriptionForCustomer(supabase, customerId(charge.customer), "canceled");
}

export async function handleChargeDisputeCreated(
  supabase: SupabaseClient,
  dispute: Stripe.Dispute,
  stripe: Stripe,
) {
  // DB change: same shape as refund — lifetime entitlement revoked, or
  // subscription downgraded, never both. No grace period here (unlike
  // invoice.payment_failed): a dispute is adversarial, not a routine card
  // decline, so this is immediate regardless of Decision #33.
  const revokedLifetime = await revokeLifetimeEntitlementByPaymentIntent(
    supabase,
    paymentIntentId(dispute.payment_intent),
  );
  if (revokedLifetime) return;

  // Dispute objects don't carry a direct customer field (only `charge`,
  // almost always an unexpanded string ID in a real webhook delivery) —
  // unlike Charge, which does. Reaching the customer for the
  // subscription-downgrade fallback requires one additional Stripe API
  // call. Test-mode only, read-only, uses the same already-configured
  // client as signature verification — flagged as a judgment call since
  // it's a new outbound call this step introduces, not because it's
  // unsafe.
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) {
    console.error("webhook charge.dispute.created: no charge id on dispute, cannot resolve customer.", dispute.id);
    return;
  }

  let custId: string | null = null;
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    custId = customerId(charge.customer);
  } catch (err) {
    console.error(
      "webhook charge.dispute.created: could not retrieve charge to resolve customer:",
      err instanceof Error ? err.message : err,
    );
    return;
  }

  await downgradeSubscriptionForCustomer(supabase, custId, "canceled");
}

// ---------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------

export async function processStripeEvent(supabase: SupabaseClient, stripe: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionSync(supabase, event.data.object as Stripe.Subscription);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
    case "charge.refunded":
      return handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
    case "charge.dispute.created":
      return handleChargeDisputeCreated(supabase, event.data.object as Stripe.Dispute, stripe);
    default:
      return;
  }
}
