// Before/after photo tagging (Documentation Coverage Gaps, 2026-07-25).
// Optional -- untagged files (existing or new) are fully supported and
// unaffected. Deliberately separate from evidence_items.category, which is
// the scoring-engine bucket (evidence_coverage/documentation_completeness),
// not a timing tag.
export const EVIDENCE_STAGES = [
  "Before Loss",
  "Immediately After Loss",
  "During Mitigation",
  "During Repairs",
  "Completed Repairs",
  "Other",
] as const;

export type EvidenceStage = (typeof EVIDENCE_STAGES)[number];

export function isEvidenceStage(value: unknown): value is EvidenceStage {
  return typeof value === "string" && (EVIDENCE_STAGES as readonly string[]).includes(value);
}
