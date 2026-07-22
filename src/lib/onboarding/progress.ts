// Claim Completion Progress System (Onboarding Step 5). Deliberately NOT
// part of src/lib/scoring/ — this has nothing to do with, and must never
// influence, Claim Grade / Documentation Score. It's a separate, purely
// derived read: no stored percentage, no new schema, no new boolean
// columns. Every value here is computed fresh from claims/evidence_items
// rows the caller already fetched, the same pure-function-of-already-
// fetched-rows pattern as claimHealth.ts and documentationScore.ts.
//
// "Complete documentation review" is deliberately NOT reused from
// claim_guarantee.step_documentation_reviewed: that field only exists for
// Pro users with an active guarantee snapshot (ensureGuaranteeSnapshot
// returns null for free users), so it can never be satisfied during
// onboarding for the majority of new signups. Instead it's a derived
// composite — true once every other milestone is — so it never requires
// new storage and works identically regardless of plan.

import { POLICY_DOCUMENT_LABEL, REPAIR_ESTIMATE_LABEL } from "@/lib/scoring/checklistTemplates";

export type OnboardingProgressClaim = {
  date_of_loss: string | null;
  damage_category: string | null;
};

export type OnboardingProgressEvidenceItem = {
  label: string;
  checked: boolean;
  category: string | null;
};

export type OnboardingMilestone = {
  key: string;
  label: string;
  done: boolean;
};

export type OnboardingProgress = {
  milestones: OnboardingMilestone[];
  percent: number;
  complete: boolean;
};

export function computeOnboardingProgress(
  claim: OnboardingProgressClaim,
  evidenceItems: OnboardingProgressEvidenceItem[],
): OnboardingProgress {
  const hasLossDate = claim.date_of_loss !== null;
  const hasDamageCategory = claim.damage_category !== null;
  const hasPolicy = evidenceItems.some((i) => i.label === POLICY_DOCUMENT_LABEL && i.checked);
  const hasPhotos = evidenceItems.some((i) => i.category === "evidence_coverage" && i.checked);
  const hasEstimate = evidenceItems.some((i) => i.label === REPAIR_ESTIMATE_LABEL && i.checked);
  const reviewed = hasLossDate && hasDamageCategory && hasPolicy && hasPhotos && hasEstimate;

  const milestones: OnboardingMilestone[] = [
    { key: "claim_created", label: "Claim created", done: true },
    { key: "loss_date_added", label: "Loss date added", done: hasLossDate },
    { key: "damage_category_selected", label: "Damage category selected", done: hasDamageCategory },
    { key: "policy_uploaded", label: "Upload policy documents", done: hasPolicy },
    { key: "photos_added", label: "Add damage photos", done: hasPhotos },
    { key: "estimates_added", label: "Add repair estimates", done: hasEstimate },
    { key: "documentation_reviewed", label: "Complete claim documentation review", done: reviewed },
  ];

  const doneCount = milestones.filter((m) => m.done).length;

  return {
    milestones,
    percent: Math.round((doneCount / milestones.length) * 100),
    complete: doneCount === milestones.length,
  };
}
