import Stripe from "stripe";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
