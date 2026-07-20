import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe/client";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { processStripeEvent } from "@/lib/stripe/webhookHandlers";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();

  // Idempotency: claim the event by inserting into processed_stripe_events
  // BEFORE processing, relying on its unique constraint (0011 migration)
  // for race-safety — two concurrent deliveries of the same event can
  // both reach this point, but only one insert can succeed. The other
  // gets a unique-violation (23505), treated as "already handled," not an
  // error.
  const { error: claimError } = await supabase
    .from("processed_stripe_events")
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("webhook: could not claim event for idempotency, refusing to process:", claimError.message);
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  try {
    await processStripeEvent(supabase, stripe, event);
  } catch (err) {
    // Processing threw — release the idempotency claim so a Stripe retry
    // (triggered by the 500 below) can actually reprocess this event
    // instead of being silently swallowed as "already handled."
    console.error("webhook: processing failed, releasing idempotency claim for retry:", err instanceof Error ? err.message : err);
    await supabase.from("processed_stripe_events").delete().eq("stripe_event_id", event.id);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
