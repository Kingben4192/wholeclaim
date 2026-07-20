import type { SupabaseClient } from "@supabase/supabase-js";

// Central entitlement resolver (Decision Log #31/#32, Billing Build Order
// Step 2). Two independent Pro grants, either one is sufficient:
//   A. profiles.subscription_status = 'active' — account-level, applies to
//      every claim the user owns.
//   B. An 'active' claim_entitlements row for this exact claim_id + user_id
//      whose entitlement_type is a lifetime-Pro type — claim-level only.
// Server-side only. Never trust a client-supplied Pro flag — every call
// site re-resolves this fresh, same discipline checkUsageGate already
// uses for AI rate limiting.

// entitlement_type is deliberately unconstrained text at the schema level
// (0011_billing_entitlements.sql) so future entitlement types don't need a
// migration rewrite. This is the list of types that currently grant Pro —
// extend it here, not in the query, when a new lifetime-Pro type ships.
export const LIFETIME_ENTITLEMENT_TYPES = ["lifetime_claim_unlock"];

// Decision #33: a subscription in Stripe's own 'past_due' state still
// grants Pro — a failed payment (expired card, bank hold, retry in
// progress) shouldn't instantly lock someone out mid-claim. This reads
// Stripe's own lifecycle status directly; no separate grace-period timer
// or expiry date is computed or stored here. When Stripe itself moves the
// subscription past what it considers recoverable, it fires
// customer.subscription.updated/deleted with a different status, and this
// resolver reflects that on the next check — same mechanism, no new
// state.
// Exported (visibility change only, no logic change) so the checkout
// route can check "does this user already have an active/past_due
// subscription" using the exact same source of truth as isPro() itself,
// rather than duplicating this list and risking drift.
export const SUBSCRIPTION_STATUSES_GRANTING_PRO = ["active", "past_due"];

export async function isPro(
  supabase: SupabaseClient,
  claimId: string,
  userId: string,
): Promise<boolean> {
  // A. Active (or past_due, per Decision #33) account subscription.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    // Unlike checkUsageGate's cap check, a failure here doesn't mean "we
    // can't tell, so deny everything" — it means "we can't tell via THIS
    // path." The claim-level entitlement check below is independent and
    // still runs; only the overall result stays fail-closed (false) if
    // both branches fail or find nothing.
    console.error("isPro: profiles query failed, falling through to entitlement check:", profileError.message);
  } else if (
    profile?.subscription_status &&
    SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(profile.subscription_status)
  ) {
    return true;
  }

  // B. Claim-level lifetime entitlement, scoped to this exact claim AND
  // this exact user — never leaks across users or across a user's other
  // claims. .limit(1) instead of .single()/.maybeSingle(): a duplicate
  // 'active' row (e.g. an accidental double purchase before Step 4's
  // already-Pro check exists) must not throw here — any match is enough.
  const { data: entitlements, error: entitlementError } = await supabase
    .from("claim_entitlements")
    .select("id, expires_at")
    .eq("claim_id", claimId)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("entitlement_type", LIFETIME_ENTITLEMENT_TYPES)
    .limit(1);

  if (entitlementError) {
    console.error("isPro: claim_entitlements query failed, denying:", entitlementError.message);
    return false;
  }

  const entitlement = entitlements?.[0];
  if (!entitlement) return false;

  // Lifetime entitlements are permanent — expires_at is null for them by
  // construction, so this never fires for the current entitlement type.
  // Kept for forward compatibility with any future non-lifetime type that
  // does set expires_at (per the approved design).
  if (entitlement.expires_at && new Date(entitlement.expires_at) < new Date()) {
    return false;
  }

  return true;
}
