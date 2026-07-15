import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe/client";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            plan: "pro",
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id,
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await supabase.from("profiles").update({ plan: "free" }).eq(
        "stripe_customer_id",
        customerId,
      );
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
