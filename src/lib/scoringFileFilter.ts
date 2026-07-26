// Keeps the Promised-Document Tracker decoupled from Documentation Score
// without touching documentationScore.ts itself. Evidence Quality &
// Organization penalizes any uploaded file not linked to a checklist item
// -- a promised-document file (only ever linked via promised_items,
// src/app/claim/actions.ts's uploadFile) would otherwise read as an
// orphaned file and drag that category down for the mere act of using the
// tracker (quantified: a real 6-point total-score drop in testing).
//
// Exclusion is narrow, not blanket: a file linked ONLY to a promised item
// is removed from the array scoring reads (neither penalized nor
// counted -- true invisibility). A file linked to a promised item AND an
// evidence_item stays in the array exactly as today -- it's already real
// evidence and must remain able to improve the score.
//
// One shared helper because computeDocumentationScore() has three call
// sites (src/app/claim/[id]/page.tsx, src/app/account/page.tsx,
// src/lib/guarantee.ts), each assembling its own `files` array -- this
// keeps the filter logic in exactly one place.
export function filesForScoring<F extends { id: string }>(
  files: F[],
  evidenceItems: { file_id: string | null }[],
  promisedItems: { file_id: string | null }[],
): F[] {
  const evidenceLinkedIds = new Set(
    evidenceItems.map((i) => i.file_id).filter((id): id is string => Boolean(id)),
  );
  const promisedOnlyIds = new Set(
    promisedItems
      .map((i) => i.file_id)
      .filter((id): id is string => Boolean(id) && !evidenceLinkedIds.has(id as string)),
  );
  return files.filter((f) => !promisedOnlyIds.has(f.id));
}
