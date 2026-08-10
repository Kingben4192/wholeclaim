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

// Free vs. Pro feature comparison. Built directly from the actual current
// gating logic:
//   - Loss-of-Use Tracker: gated by isPro in LossOfUseTracker.tsx itself
//   - Evidence upload cap: src/lib/uploadLimits.ts,
//     FREE_UPLOAD_LIMIT_PER_CLAIM = 25 (Decision, Billing Build Order
//     Step 6)
//   - Active claims: src/lib/claimCategoryGate.ts,
//     FREE_CLAIM_LIMIT_PER_CATEGORY = 1 (Decision #44)
//
// Urgent pricing-page fix (2026-08-08, master direct, founder-authorized):
// the AI analysis row and the two AI-only Pro tools (Mold Coverage
// Timeline, Supplement Assistant) are removed from this table entirely,
// per explicit instruction -- not relabeled, removed. The underlying
// tools themselves are unchanged by this fix and remain fully live in
// the product; only this pricing-page listing is affected.
export const FEATURE_COMPARISON: { feature: string; free: string; pro: string }[] = [
  { feature: "The Binder & Claim Grade", free: "Included", pro: "Included" },
  { feature: "Evidence Vault uploads", free: "Up to 25 files per claim", pro: "Unlimited" },
  { feature: "Storage", free: "500MB per claim, 2GB per account", pro: "10GB per account" },
  { feature: "Deadline Tracker", free: "Included", pro: "Included" },
  { feature: "Loss-of-Use Tracker", free: "Not included", pro: "Included" },
  {
    feature: "Active claims",
    free: "1 per dispute category",
    pro: "Unlimited",
  },
] as const;
