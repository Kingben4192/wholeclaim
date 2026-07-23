// Single source of truth for WholeClaim Pro pricing copy (Decision #16).
// Extracted 2026-07-23 — before this, the same price/description text was
// typed independently in UpgradeOptions.tsx and pricing/page.tsx, with no
// shared constant anywhere in the codebase (confirmed via repo-wide search
// during the 2026-07-23 pricing audit). Both now import from here, as does
// the new homepage pricing section, so the actual numbers and copy live in
// exactly one place. Presentation (font size, layout, className) stays
// local to each usage — only content is shared.
export const PRO_SUBSCRIPTION = {
  priceAmount: "$19",
  pricePeriod: "/month",
  buttonLabel: "Upgrade to Pro",
  description: "Unlock WholeClaim Pro features with a monthly subscription.",
} as const;

export const PRO_LIFETIME = {
  priceAmount: "$49",
  pricePeriod: " one-time",
  buttonLabel: "Unlock This Claim",
  description: "Unlock WholeClaim Pro features for this claim permanently.",
} as const;

// Free vs. Pro feature comparison — NEWLY PROPOSED 2026-07-23, not pulled
// from an existing constant. None existed anywhere in the codebase: the
// only prior "Free vs Pro" comparison was a table in 06_Website/Website-
// Copy.md (a planning doc, not live code, and already flagged as stale
// during the pricing audit). This list is built directly from the actual
// current gating logic, not that doc:
//   - AI tool cap: src/lib/anthropic/rateLimit.ts (checkUsageGate,
//     Decision #32 — 3 analyses/claim shared across the 5 tools below,
//     not per-tool)
//   - Pro-only tools with zero free allowance: rateLimit.ts's
//     requireProAiAccess call sites (Mold Coverage Timeline, Supplement
//     Assistant)
//   - Loss-of-Use Tracker: gated by isPro in LossOfUseTracker.tsx itself
//   - Evidence upload cap: src/lib/uploadLimits.ts,
//     FREE_UPLOAD_LIMIT_PER_CLAIM = 25 (Decision, Billing Build Order
//     Step 6)
export const FEATURE_COMPARISON: { feature: string; free: string; pro: string }[] = [
  { feature: "The Binder & Claim Grade", free: "Included", pro: "Included" },
  { feature: "Evidence Vault uploads", free: "Up to 25 files per claim", pro: "Unlimited" },
  { feature: "Deadline Tracker", free: "Included", pro: "Included" },
  {
    feature: "AI analysis (Policy Decoder, Loss-Count Auditor, Estimate Gap Analyzer, Decision Assistant, Letter Builder)",
    free: "3 analyses per claim",
    pro: "Unlimited (fair use)",
  },
  { feature: "Mold Coverage Timeline", free: "Not included", pro: "Included" },
  { feature: "Supplement Assistant", free: "Not included", pro: "Included" },
  { feature: "Loss-of-Use Tracker", free: "Not included", pro: "Included" },
] as const;
