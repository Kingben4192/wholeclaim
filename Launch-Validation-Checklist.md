# Launch Validation Checklist

Per the "WholeClaim — Master Launch & Operating Plan," Section 1 (Production
Readiness). Every major feature: tested locally → tested in preview →
tested in production. This tracks the last leg — production — for the
2026-07-24 deploy (security hardening + Documentation Score fix) and
becomes the standing template for future production promotions.

Local and preview verification for this deploy are recorded in
`claude-code-deploy-instructions.md`. The items below are specifically
**production** verification, on `getwholeclaim.com` itself, not the preview
domain.

## Deploy
- [ ] Deploy current build to Vercel production (`vercel --prod`)
- [ ] Confirm `getwholeclaim.com` and `www.getwholeclaim.com` serve the new build (not a stale cache)

## Production smoke tests
- [ ] Account creation
- [ ] Magic-link login (email received, link clicked, redirect, session persists)
- [ ] Claim creation
- [ ] Documentation Score (existing claim loads, score displays, Before/After Grade, no false F/0 baseline, numeric improvement within a letter band displays correctly)
- [ ] Evidence upload (Evidence Vault)
- [ ] AI tools (at least one of: Policy Decoder, Loss-Count Auditor, Estimate Gap Analyzer, Decision Assistant, Letter Builder)
- [ ] Export/share flow
- [ ] Billing (test mode — Stripe is not live yet; verify checkout session creation still works correctly in test mode)

## Notes
- Fill in pass/fail per item as the production smoke test is actually run — this file starts as an unchecked scaffold, not a claim that production has been verified.
- If any item fails in production despite passing in preview/local, that's a signal worth its own investigation before calling the deploy stable — same standard as any other regression this session.
