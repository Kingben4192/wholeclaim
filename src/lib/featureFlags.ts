// Pricing-page urgent fix (2026-08-08, master direct) -- scoped narrowly
// to the Pro Lifetime SKU only, per explicit founder instruction: pricing
// copy + the checkout endpoint, no other changes. Deliberately does NOT
// include the AI-advisory flag architecture built on feature/pro-storage-
// tier (AI_ADVISORY_ENABLED, per-tool flags) -- that's a separate, larger
// change still gated behind the Section 8 attorney review and hasn't been
// authorized for production. Keeping this file minimal on master rather
// than importing the fuller feature-branch version avoids pulling in
// anything beyond what was actually approved for this deploy.

export const PRO_LIFETIME_ENABLED = false;
