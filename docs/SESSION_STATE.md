# Session state — 2026-07-26

Handoff snapshot for picking this session back up. Production is live at `getwholeclaim.com`, Supabase project ref `hkjqyjhunfbdcnwyjaqd`.

## What shipped in `96dac8c` (deployed, `dpl_8AY9HVreSC7vB51eZVoRieP1c7f5`)

**Promised-Document Tracker** — tracks a carrier-side commitment ("they said the denial letter was coming") as a new `promised_items` table (migration `0024_promised_document_tracker.sql`, confirmed applied to the hosted production project, not just local). Deliberately a separate table from `evidence_items` — a promised document is something the *carrier* owes the user, not the user's own checklist of what they think they need.

- Status (`promised` / `aging` / `overdue` / `received`) is derived from `file_id`/dates at read time, never stored — same philosophy as `evidence_items`' `checked`/`file_id`-driven scoring (`src/lib/promisedItems.ts`).
- `uploadFile` (`src/app/claim/actions.ts`) extended with an optional `promisedItemId` parameter, mutually exclusive with the existing `evidenceItemId` — reuses the entire existing Storage/validation/rate-limit path rather than a second upload mechanism.
- No "mark received without a file" action — deliberately consistent with the rest of the app's evidence-backed-status philosophy.
- New UI: `src/app/claim/[id]/PromisedDocumentTracker.tsx`, a new section on the claim detail page.

## The scoring-filter fix, and why `documentationScore.ts` was left untouched

Verification caught a real regression before it shipped: marking a promised item "received" requires uploading a file (by design, see above), and that file landed in the same `files` table Documentation Score reads. Evidence Quality & Organization scores what fraction of *all* uploaded files are linked to a checklist item — a promised-document file isn't linked to any `evidence_item`, so it read as an orphaned file and dragged that category down. Quantified directly: **a real 6-point total-score drop (53→47)** in a test case with otherwise-identical data.

**Fix**: `src/lib/scoringFileFilter.ts` — one shared `filesForScoring()` helper, applied at all three real call sites of `computeDocumentationScore` (enumerated via `grep`, not assumed): `src/app/claim/[id]/page.tsx`, `src/app/account/page.tsx`, `src/lib/guarantee.ts`. It excludes a file from the scoring input **only** when it's linked exclusively to a promised item and to no evidence item — a file linked to both stays in the array and counts normally, so a filed promised document (e.g. an actually-received denial letter) remains real evidence and can still improve the score.

**Why `documentationScore.ts` itself was left untouched**: this keeps the confidential scoring engine (Decision #40's confidentiality boundary — weights/maxes/raw points never reach a client) completely unaware that `promised_items` exists at all. The two systems stay decoupled by construction at the call sites, not by teaching the engine a new input type. Verified: the exact case that showed 53→47 now shows 53→53 (delta 0), and a file linked to both a promised item and an evidence item correctly still improves the score (verified rising to 74 in the same test progression).

## Outstanding queue, roughly in the order raised this session

1. **Promote the scoring-regression test to permanent** — was a throwaway `*.temp.test.ts`, deleted after manual verification each time. Being promoted to a permanent file in this same pass (see below).
2. **Dependabot — 4 vulnerabilities on master (3 high, 1 moderate)** — reported as flagged, not yet actually investigated this session. Need to pull the actual advisories and assess fixability via version bumps.
3. **Grade-boundary results-screen proposal** — `BeforeAfterGrade.tsx`'s "Next steps" currently shows plain recommendation descriptions with no indication of what crossing a grade boundary would take. Proposed (not built): a server-computed, boundary-safe derived field per recommendation (e.g. `wouldReachGrade: "D"`) — never a raw point value, keeping Decision #40's confidentiality rule intact. Standing proposal, awaiting a build go-ahead.
4. **Soft-delete tradeoff report** — requested (schema impact, RLS implications, interaction with the free-tier category-slot limits from Decision #44, purge-job requirements) — not yet written.
5. **Deadline engine, party registry, allowance reconciliation** — all three audited and reported on in depth (see conversation history); explicitly held at report-only per the founder's own instruction ("Promised-document tracker first. Report only on the rest."). Real, sized gaps found in all three; none scoped into an implementation plan yet.

## Known-open items from earlier in the session, still unresolved

- The original unexplained delete-account Sentry event (`d369c4e1`) — `signOut()` theory disconfirmed by direct test; root cause still unknown. Logged in `TODO.md`. `Sentry.setUser()` is live now, so a recurrence should be traceable to a specific account next time.
- `support@getwholeclaim.com` still has no MX records (confirmed via direct DNS lookup) — ImprovMX chosen as the fix, founder's own DNS/account setup, not yet done as of last check.
- The Supabase support-ticket draft (`getwholeclaimaryking.md`, oddly named but real content) documents the recurring `leads` RLS drift pattern through 2026-07-19 — doesn't yet include this week's additional recurrence or the separately-diagnosed P0 (signed-in users blocked, fixed `31da388`). Worth updating before actually sending it.
