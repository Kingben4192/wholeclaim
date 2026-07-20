# WholeClaim Development Instructions

## Product Purpose

WholeClaim is a documentation organization platform for property insurance claims.

The product helps users:
- organize photos
- store documents
- create timelines
- manage claim information
- share organized records

WholeClaim does NOT:
- guarantee claim approval
- guarantee payouts
- provide legal advice
- replace insurance professionals

## Technology Stack

Use:
- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

Follow existing project patterns.

## Development Rules

Before making changes:
- Preserve existing authentication flows.
- Do not break Claim Grade.
- Do not break Claim Binder creation.
- Do not modify database schema without approval.

## Current Build Priority

Status against the original priority order:

1. **Public homepage conversion flow** — Built. Homepage v2 shipped (hero, Example Claim File preview, Features grid, trust band, final CTA).
2. **Free Claim Binder experience** — Built. Claim creation, entries, deadlines, and evidence checklist are all live.
3. **Claim Grade funnel** — Built. Quiz, results, and the magic-link handoff into a pre-filled claim are all working.
4. **Evidence organization** — Built. Evidence Vault uploads, Supabase Storage, and RLS are in place and verified.
5. **Workspace stability** — Mostly built; this is the actual current gate before beta.

Open items blocking the stability gate:
- Supabase Auth redirect URL configuration (magic-link login was landing on the homepage instead of signing the user in) — root cause identified and fixed; pending the founder running the config change and reverifying.
- M6 regression testing (Test Run 02, G1–G6) has not yet been executed inside the deployed app.

## Billing Rules

Pro plan is built, not just planned: Stripe Checkout (monthly subscription and one-time claim unlock), webhook-driven entitlements, and the Customer Portal are all implemented and verified in Stripe **TEST MODE**.

Live/paid billing stays gated regardless of build status: no real charge goes live, and Stripe stays in test mode, until attorney review approves pricing, billing, and terms.
