// Dispute-category taxonomy for free-plan claim limits (Decision #44).
// Deliberately separate from claimTypeProfile.ts's ClaimTypeProfile
// (a loss-cause taxonomy — Water/WindHail/Fire/Theft/Plumbing/Other —
// tightly coupled to Documentation Score checklist seeding). This enum
// answers a different question ("what kind of dispute is this") and must
// never be conflated with damage_category.
//
// This is the ONLY place "5 categories" is ever expressed. "Up to 5 active
// claims total" (1 per category) is purely CLAIM_CATEGORIES.length — never
// hardcode that number anywhere else.
//
// Must be kept in exact sync by hand with the CHECK constraint in
// supabase/migrations/0019_claim_lifecycle_and_category_limits.sql —
// Postgres cannot import this file.
export const CLAIM_CATEGORIES = [
  "Insurance Claim",
  "Water / Utility Dispute",
  "Contractor Dispute",
  "Property Damage",
  "Other",
] as const;

export type ClaimCategory = (typeof CLAIM_CATEGORIES)[number];

export function isClaimCategory(value: unknown): value is ClaimCategory {
  return typeof value === "string" && (CLAIM_CATEGORIES as readonly string[]).includes(value);
}

// Must be kept in sync with the CHECK constraint in the same migration.
export const CLAIM_STATUSES = ["active", "resolved", "archived", "closed"] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === "string" && (CLAIM_STATUSES as readonly string[]).includes(value);
}
