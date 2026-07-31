// Billing Build Order Step 6 — the ONE configuration location for the
// free-tier evidence upload cap. Product model: free = "limited evidence
// storage", Pro = "unlimited uploads" (Roadmap.md). No prior numeric limit
// existed anywhere in the codebase before this — 25 is the founder's
// explicit MVP decision (2026-07-18), not silently invented here.
export const FREE_UPLOAD_LIMIT_PER_CLAIM = 25;

// Storage enforcement (Decision #88, 04_Engineering/STORAGE_ENFORCEMENT_BRIEF.md).
// Free tier is a flat ceiling with no buffer of any kind (Decision #55,
// clarified 2026-07-31 -- the "500MB emergency buffer" language in
// Decisions #81/#82 is a Pro-tier concept only, not free). Pro gets a real
// ceiling too, not "unlimited" -- Decision #81 -- with a buffer beyond it
// that free does not get.
const MB = 1024 * 1024;
const GB = 1024 * MB;

export const FREE_STORAGE_LIMIT_PER_CLAIM_BYTES = 500 * MB;
export const FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES = 2 * GB;
export const PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES = 10 * GB;
export const PRO_STORAGE_BUFFER_BYTES = 500 * MB;
