// Claim-type profile mapping and the evidence-category taxonomy — pure
// config/lookup data, no scoring formulas or weights. Deliberately kept in
// its own module, isolated from documentationScore.ts (which holds the
// actual point-math), so this can be safely imported into a Client
// Component (e.g. the Claim Creation Wizard's checklist preview) without
// bundling the confidential scoring engine into client JavaScript.
// documentationScore.ts re-exports both symbols below for its own callers.

export type ClaimTypeProfile = "Water" | "WindHail" | "Fire" | "Theft" | "Plumbing" | "Other";

export type EvidenceCategory = "evidence_coverage" | "documentation_completeness";

const DAMAGE_CATEGORY_TO_PROFILE: Record<string, ClaimTypeProfile> = {
  "Water / plumbing": "Water",
  "Roof / storm": "WindHail",
  Hail: "WindHail",
  "Wind / storm": "WindHail",
  Fire: "Fire",
  Mold: "Water",
  Theft: "Theft",
};

export function claimTypeProfile(damageCategory: string | null): ClaimTypeProfile {
  if (!damageCategory) return "Other";
  return DAMAGE_CATEGORY_TO_PROFILE[damageCategory] ?? "Other";
}
