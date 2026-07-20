// Billing Build Order Step 6 — the ONE configuration location for the
// free-tier evidence upload cap. Product model: free = "limited evidence
// storage", Pro = "unlimited uploads" (Roadmap.md). No prior numeric limit
// existed anywhere in the codebase before this — 25 is the founder's
// explicit MVP decision (2026-07-18), not silently invented here.
export const FREE_UPLOAD_LIMIT_PER_CLAIM = 25;

// Future enhancement, NOT implemented in Step 6 — file-count enforcement
// only, per explicit scope. A byte-sum limit (e.g. FREE_UPLOAD_STORAGE_LIMIT_MB
// = 250) would live here as a sibling constant, and would only require
// adding one more query + condition inside checkUploadAccess
// (src/lib/uploadGate.ts) — no rewrite of uploadFile or any UI component.
