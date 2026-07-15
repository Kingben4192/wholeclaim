import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe/client";
import { assignCohort, getPriceId, type PricingCohort } from "@/lib/stripe/cohort";

export async function POST() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, pricing_cohort")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") {
    return NextResponse.json({ error: "Already on Pro." }, { status: 400 });
  }

  let cohort = profile?.pricing_cohort as PricingCohort | null;
  if (!cohort) {
    cohort = assignCohort(user.id);
    await supabase.from("profiles").update({ pricing_cohort: cohort }).eq("id", user.id);
  }

  const priceId = getPriceId(cohort);
  if (!priceId) {
    return NextResponse.json(
      { error: "Pricing isn't configured yet." },
      { status: 503 },
    );
  }

  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const session = await stripe.checkout.sessions.create({
    mode: cohort === "onetime" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    success_url: `${appUrl}/claim?upgraded=1`,
    cancel_url: `${appUrl}/claim`,
  });

  return NextResponse.json({ url: session.url });
}
