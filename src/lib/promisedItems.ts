// Promised-Document Tracker status derivation -- pure function, status is
// always derived from file_id/dates, never stored, same philosophy as
// evidence_items' checked/file_id-driven scoring in documentationScore.ts.
// No confidentiality boundary here (nothing proprietary), unlike that file.

export type PromisedItemStatus = "received" | "overdue" | "aging" | "promised";

export type PromisedItemLike = {
  file_id: string | null;
  promised_date: string;
  target_date: string | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Starting default for "no ETA given, but it's been a while" -- a proposed
// constant, not a researched threshold.
const AGING_THRESHOLD_DAYS = 14;

export function statusForPromisedItem(item: PromisedItemLike, now: Date = new Date()): PromisedItemStatus {
  if (item.file_id) return "received";

  if (item.target_date) {
    return new Date(item.target_date).getTime() < now.getTime() ? "overdue" : "promised";
  }

  const daysSincePromised = (now.getTime() - new Date(item.promised_date).getTime()) / MS_PER_DAY;
  if (daysSincePromised > AGING_THRESHOLD_DAYS) return "aging";

  return "promised";
}
