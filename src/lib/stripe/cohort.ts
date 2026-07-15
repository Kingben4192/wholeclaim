export type PricingCohort = "onetime" | "subscription";

// Stable hash-based 50/50 split so a given user always lands in the same
// cohort — Decision Log #16 (Open) tests $49 one-time vs $19/month.
export function assignCohort(userId: string): PricingCohort {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % 2 === 0 ? "onetime" : "subscription";
}

export function getPriceId(cohort: PricingCohort) {
  return cohort === "onetime"
    ? process.env.STRIPE_PRICE_ONETIME
    : process.env.STRIPE_PRICE_SUBSCRIPTION;
}
