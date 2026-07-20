import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe/client";
import { isPro, SUBSCRIPTION_STATUSES_GRANTING_PRO } from "@/lib/entitlements";

// Billing Build Order Step 4 — extends the Step 1 checkout route (does not
// replace it). Previously: no request body, an auto-assigned cohort
// (Decision Log #16's A/B test), metadata: { user_id } only, no claim_id
// concept anywhere. Now: an explicit user choice between the two purchase
// paths, replacing the hidden cohort assignment — the dual-option UI
// (UpgradeOptions.tsx) POSTs { purchaseType: 'subscription' } or
// { purchaseType: 'lifetime', claimId }.
//
// The Step 3 webhook (unmodified) requires metadata.claim_id on the
// lifetime path — that contract is enforced here, not there.

type CheckoutBody = {
  purchaseType?: "subscription" | "lifetime";
  claimId?: string;
};

async function resolveStripeCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stripe: Stripe,
  userId: string,
  userEmail: string | undefined,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { user_id: userId },
  });

  const { error } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (error) {
    console.error("checkout: could not persist new stripe_customer_id:", error.message);
  }

  return customer.id;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const purchaseType = body.purchaseType;
  const claimId = body.claimId ? String(body.claimId) : null;

  if (purchaseType !== "subscription" && purchaseType !== "lifetime") {
    return NextResponse.json({ error: "Unknown purchase type." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();
  if (profileError) {
    console.error("checkout: could not load profile:", profileError.message);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripe = getStripeClient();

  if (purchaseType === "subscription") {
    if (
      profile?.subscription_status &&
      SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(profile.subscription_status)
    ) {
      return NextResponse.json({ error: "You already have an active Pro subscription." }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRICE_SUBSCRIPTION;
    if (!priceId) {
      return NextResponse.json({ error: "Pricing isn't configured yet." }, { status: 503 });
    }

    try {
      const customerId = await resolveStripeCustomer(
        supabase,
        stripe,
        user.id,
        user.email,
        profile?.stripe_customer_id ?? null,
      );

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: user.id,
        metadata: { user_id: user.id, purchase_type: "subscription" },
        success_url: `${appUrl}/claim?upgraded=1`,
        cancel_url: `${appUrl}/claim`,
      });
      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error("checkout: subscription session creation failed:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
    }
  }

  // purchaseType === "lifetime"
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required for a lifetime purchase." }, { status: 400 });
  }

  // Security requirement: reject if the claim doesn't belong to this user.
  // RLS on `claims` (auth.uid() = user_id) already makes a mismatched
  // claim_id return zero rows via the authenticated client used here — this
  // explicit check makes that an intentional, clearly-labeled authorization
  // error rather than an incidental empty result.
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, deleted_at")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (claimError) {
    console.error("checkout: claim ownership check failed:", claimError.message);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 500 });
  }
  if (!claim) {
    return NextResponse.json({ error: "You don't have access to this claim." }, { status: 403 });
  }
  if (claim.deleted_at) {
    return NextResponse.json({ error: "This claim has been deleted." }, { status: 400 });
  }

  const alreadyPro = await isPro(supabase, claimId, user.id);
  if (alreadyPro) {
    return NextResponse.json({ error: "This claim already has Pro access." }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ONETIME;
  if (!priceId) {
    return NextResponse.json({ error: "Pricing isn't configured yet." }, { status: 503 });
  }

  try {
    const customerId = await resolveStripeCustomer(
      supabase,
      stripe,
      user.id,
      user.email,
      profile?.stripe_customer_id ?? null,
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id, claim_id: claimId, purchase_type: "claim_lifetime" },
      success_url: `${appUrl}/claim/${claimId}?upgraded=1`,
      cancel_url: `${appUrl}/claim/${claimId}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout: lifetime session creation failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
  }
}
