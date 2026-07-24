# Claude Code Deploy Instructions — Preview Test Gate (2026-07-24)

Record of the deploy-gate process Claude Code executed before promoting the
security-hardening + Documentation Score fix batch to production, per the
founder's "Deployment Instructions — Preview Test Gate" and the later
"WholeClaim — Master Launch & Operating Plan" (Section 0).

## What was being gated

Two local commits, built up over the session and reviewed individually as
they were made:

- `de9e88e` — Security review: HIGH/MEDIUM/LOW RLS + validation fixes, Tier 1
  hardening (CSP/security headers, Dependabot), Help & Support Center page,
  legal-draft support-email corrections.
- `84ce157` — Documentation Score progress card fix: null-baseline handling,
  numeric-vs-letter-grade progress classification, actionable zero-score
  category messaging.

## Process followed

1. **Push to `master`, hold at preview.** Pushed both commits to
   `origin/master`. Discovered the project's Vercel integration does not
   auto-promote `master` pushes to production — they land as `preview`
   target deployments; production requires an explicit `vercel --prod` (or
   dashboard promotion) step. This turned out to align with the founder's
   own gate requirement (deploy to preview, hold for manual sign-off before
   production) rather than working against it.
2. **Attempted direct verification of the preview URL** — blocked. Every
   preview URL for this project (branch alias and deployment-hash URLs) is
   protected by Vercel's own Deployment Protection (SSO redirect to
   `vercel.com/sso-api`). No browser/Vercel session available in this
   environment to get past it.
3. **Fallback: local production build of the exact same commit.** Ran
   `next build && next start` against the identical pushed commit (verified
   via `git status`/`git log` match beforehand), hitting it with real HTTP
   requests and real Supabase-issued sessions (via `@supabase/ssr`'s own
   cookie-setting logic — not fabricated tokens). This validates all
   server-side logic, RLS enforcement, and rendered output identically to
   what preview is running; it does not validate Vercel's specific edge
   runtime (separately checked against Vercel's own docs: custom headers
   pass through unmodified, and Vercel Toolbar is preview-only by default,
   not injected into this project's production).

## Manual test checklist — results

### Magic-link authentication
| Item | Result |
|---|---|
| Create a test account | Pass (automated, real Supabase user) |
| Request magic link | Pass (automated) |
| Receive email | Not independently tested by Claude Code (no inbox access) — **confirmed manually by the founder** on the live production domain after deploy |
| Click link / confirm redirect works | Partially automated (session-mechanism verified); **confirmed manually by the founder**, live, end-to-end |
| Confirm session persists | Pass (automated) |
| User lands in correct account/dashboard state | Pass (automated) |
| New user flow works | Pass (automated + founder's manual pass) |
| Existing user flow works | Pass (automated) |
| Expired/used link behaves correctly | Pass (automated — reused token correctly rejected) |

### Documentation Score / Claim Grade
All five items (existing claim loads, score displays, Before/After Grade
behavior, no false F/0 baseline, numeric improvements display correctly) —
**Pass**, automated, including constructing a real same-letter-band
improvement on a live rendered page to confirm the fix's banner logic.

### Security-sensitive flows
All four items (claim isolation, Evidence Vault upload, files remain
private, export/share) — **Pass**, automated against real, throwaway
Supabase users and real Storage objects, cleaned up after.

## Founder confirmation

The founder manually tested the magic-link email and browser click-through
live and confirmed it worked end-to-end (email received, link clicked,
redirect succeeded, session persisted) — closing the two items Claude Code
could not test directly. All gate conditions confirmed met; founder gave
explicit go-ahead to run `vercel --prod`.

## Post-launch tracked item

Enabling Dependabot alerts as part of this batch surfaced 12 existing
dependency vulnerabilities (6 high, 6 moderate) in this repo. Tracked
separately in `TODO.md` — explicitly scoped as post-launch, not a gate
condition, per the founder's own instruction not to blindly update
dependencies right before launch.
