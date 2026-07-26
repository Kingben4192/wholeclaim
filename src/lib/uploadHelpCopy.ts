// Upload/storage limit help copy -- single source, imported by both the
// inline accordion on the claim detail page's Evidence Vault section
// (UploadHelp.tsx) and /help's FAQ list, so the two surfaces can't drift
// out of sync.
//
// IMPORTANT: this copy describes the 25-file-per-claim cap ONLY -- the
// actual, currently-shipped limit (FREE_UPLOAD_LIMIT_PER_CLAIM,
// src/lib/uploadLimits.ts). Decisions #52 (soft delete frees a count slot,
// bytes only free on hard purge) and #55 (500MB per-claim / 2GB
// per-account byte limits, storage_status enum) are both explicitly
// "policy only, nothing built" as of 2026-07-26 -- no soft-delete flag,
// no byte tracking, no account-level ceiling exist anywhere in the schema
// or code today. This copy MUST be rewritten when #52 and/or #55 actually
// ship: question 2's answer changes once deletion stops being an
// immediate hard delete, and question 3 should be replaced with a real
// per-claim-vs-per-account explanation once an account ceiling exists to
// explain.

export const UPLOAD_HELP_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why can't I upload?",
    a: "Free accounts include 25 uploaded files per claim. You've reached that limit for this claim — upgrade to Pro for unlimited uploads, or delete a file you no longer need to make room.",
  },
  {
    q: "Does deleting a file free up space?",
    a: "Yes — deleting a file removes it permanently and immediately frees a slot in your 25-file limit for this claim.",
  },
  {
    q: "Why does the limit apply even though my other claims have room?",
    a: "The 25-file limit is per claim, not shared across your account — each claim gets its own 25 free uploads.",
  },
];
