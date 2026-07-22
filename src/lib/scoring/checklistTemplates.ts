// Claim-type checklist seeding content for Documentation Score v1 (Decision
// Log #40). This is product copy, not proprietary scoring logic — safe to
// iterate on directly, unlike documentationScore.ts's weights/formulas.
// Seeded once, at claim creation only (createClaim, src/app/claim/actions.ts).
// Existing claims created before this shipped are never retroactively
// seeded or reseeded — see the schema/checklist plan doc for why.

import { claimTypeProfile, type ClaimTypeProfile, type EvidenceCategory } from "./claimTypeProfile";

export type ChecklistTemplateItem = { label: string; category: EvidenceCategory };

// Exported so other consumers (e.g. onboarding progress) can identify
// these specific baseline items without duplicating the label text —
// single source of truth stays here.
export const POLICY_DOCUMENT_LABEL = "Full insurance policy (declarations, forms, endorsements)";
export const REPAIR_ESTIMATE_LABEL = "Contractor or repair estimate";

const BASELINE_EVIDENCE_COVERAGE: ChecklistTemplateItem[] = [
  { label: "Wide shot of each affected room or area", category: "evidence_coverage" },
  { label: "Close-up photos of the visible damage", category: "evidence_coverage" },
  { label: "Photos of damaged personal property / contents", category: "evidence_coverage" },
  { label: "Photos from multiple angles of each major damage point", category: "evidence_coverage" },
];

const BASELINE_DOCUMENTATION_COMPLETENESS: ChecklistTemplateItem[] = [
  { label: POLICY_DOCUMENT_LABEL, category: "documentation_completeness" },
  { label: REPAIR_ESTIMATE_LABEL, category: "documentation_completeness" },
  { label: "Invoices for completed repair work", category: "documentation_completeness" },
  { label: "Receipts for out-of-pocket expenses", category: "documentation_completeness" },
  { label: "Correspondence log with the carrier", category: "documentation_completeness" },
  { label: "Inspection report (carrier or independent)", category: "documentation_completeness" },
];

const PROFILE_ADDITIONS: Record<ClaimTypeProfile, ChecklistTemplateItem[]> = {
  Water: [
    { label: "Moisture reading documentation", category: "documentation_completeness" },
    { label: "Drying/mitigation company invoice", category: "documentation_completeness" },
    { label: "Date-stamped photos taken within 24-48 hrs of discovery", category: "evidence_coverage" },
  ],
  WindHail: [
    { label: "Exterior/roof elevation photos (all sides)", category: "evidence_coverage" },
    { label: "Weather-event documentation (storm report, NOAA data)", category: "documentation_completeness" },
    { label: "Estimate line items matched to damage photos", category: "documentation_completeness" },
  ],
  Fire: [
    { label: "Itemized contents/loss inventory", category: "documentation_completeness" },
    { label: "Smoke and soot damage photos", category: "evidence_coverage" },
    { label: "Structural assessment report", category: "documentation_completeness" },
  ],
  Theft: [
    { label: "Police report", category: "documentation_completeness" },
    { label: "Itemized loss list", category: "documentation_completeness" },
    { label: "Proof of ownership or value (receipts, photos, appraisals)", category: "documentation_completeness" },
  ],
  Plumbing: [
    { label: "Point-of-failure photos", category: "evidence_coverage" },
    { label: "Repair invoice", category: "documentation_completeness" },
    { label: "Moisture reading documentation", category: "documentation_completeness" },
    { label: "Drying/mitigation company invoice", category: "documentation_completeness" },
  ],
  Other: [],
};

export function checklistTemplateFor(damageCategory: string | null): ChecklistTemplateItem[] {
  const profile = claimTypeProfile(damageCategory);
  return [...BASELINE_EVIDENCE_COVERAGE, ...BASELINE_DOCUMENTATION_COMPLETENESS, ...PROFILE_ADDITIONS[profile]];
}
