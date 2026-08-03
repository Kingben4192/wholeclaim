# TODO

## Post-launch security maintenance

Created 2026-07-24, after the Tier 1 security hardening deploy (commit `de9e88e`)
enabled Dependabot alerts. The push to `master` immediately surfaced:

**12 Dependabot vulnerabilities: 6 high, 6 moderate.** (github.com/Kingben4192/wholeclaim/security/dependabot)

- [x] Review each finding individually — done; `npm audit` actually showed 13
      distinct GHSA advisories (7 high, 6 moderate) across 3 packages, not 12
      — GitHub's Dependabot indexing was slightly behind npm's own advisory feed
- [x] For each: determine exploitable vs non-exploitable in this app's actual
      usage — documented against real codebase usage (Turbopack, Server Actions,
      no custom server, no `rewrites()`, no edge runtime, no `next/image` import)
- [x] For each: identify the upgrade path and assess breaking-change risk —
      all 13 resolved via one patch-level bump, `next` 16.2.10 → 16.2.11
- [x] Patch in a controlled, deliberate update — done (commit `eb04c67`),
      full regression + live functional verification (auth, claim creation,
      evidence upload, AI tool wiring) before deploy
- [x] Sequenced after the prior production deploy was confirmed stable

**Remaining, tracked separately (approved as a deliberate scope decision —
not bundled into the patch release to avoid unnecessary risk immediately
before beta):**

- [ ] 4 advisories (postcss, sharp) remain — both are *vendored, nested*
      dependencies of `next@16.2.11` itself, pinned internally below the
      patched threshold (`postcss@8.4.31`, `sharp@^0.34.5`). Not fixable via
      this app's own `package.json` without an `overrides` entry.
- [ ] Monitor for the next Next.js patch release that updates its own
      vendored postcss/sharp versions — likely resolves this with zero
      app-side changes needed, same as this round.
- [ ] If no upstream fix lands in a reasonable timeframe, evaluate a
      separately-scoped `overrides` implementation with its own full
      regression pass before adopting it — do not fold this into a future
      unrelated change.

Dependabot's own version-update PRs (`.github/dependabot.yml`, weekly, npm +
GitHub Actions) will keep opening on their own regardless — this task was
about the *existing* findings specifically, not the ongoing automated PRs.

## Observability gaps (not urgent — log for next incident)

Surfaced 2026-07-24 while debugging a reported `/api/auth/send-email-hook`
failure with no timestamp, error message, or affected email to go on. Found
a real, separate bug in the process (Preview environment was missing
`RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`SEND_EMAIL_HOOK_SECRET` — fixed), but
the originally reported symptom itself couldn't be chased down, because
there was no log trail available at all:

- [ ] **Sentry read/auth token** — the app only has a write-side DSN
      (Decision #42) for *sending* error events; there's no
      `SENTRY_AUTH_TOKEN` or equivalent for querying past events back out.
      Without one, Claude Code (or anyone debugging without dashboard
      access) can't pull historical Sentry data at all.
      Separately worth knowing whenever this gets picked up:
      `send-email-hook`'s own failure paths (missing-config guard, webhook
      signature-verification catch, Resend-error catch) all `return` clean
      JSON error responses rather than throwing — Sentry's automatic
      instrumentation mainly captures uncaught exceptions, so even with a
      read token, these specific failure modes likely wouldn't show up as
      captured events unless explicit `Sentry.captureException`/
      `captureMessage` calls are added to that route (and probably the
      other similarly-structured "catch and return JSON" routes too).
- [ ] **Vercel log retention** — the Hobby plan appears to retain
      effectively nothing historically outside of live `--follow`
      streaming (confirmed empty on every `vercel logs` query tried,
      including `--since 7d`). A paid tier's longer retention window would
      make "what happened at approximately time X" answerable after the
      fact, which it currently isn't.

Neither blocks anything today. The point of logging them is narrower: the
next time something gets reported without a reproducible timestamp/error/
affected-user, there should be an actual log trail to check instead of
reconstructing from memory or re-deriving root cause from first principles.

## Open investigation — unexplained delete-account Sentry event

Sentry event `d369c4e1`, 2026-07-26 00:43:02 UTC, `javascript-nextjs` /
`vercel-production`: a real user (Cammie) deleted her account, then a
second action (breadcrumbs show a click matching `AccountMenu`'s "Log out"
button, `POST /account`, HTTP 200) resulted in an unparseable RSC response
reaching the client — "An unexpected response was received from the
server."

Ruled out: `signOut()` itself throwing for a session whose underlying
account was just hard-deleted — tested directly against a real throwaway
account (create session → hard-delete the user → call `signOut()` with the
now-stale session), it returns cleanly with no error and does not throw.
The theory that this was the cause is disconfirmed.

Also confirmed unrelated to `/login`/magic-link sending — the original
report was misattributed to that flow; the actual event's `url` tag and
breadcrumbs are specific to `/account`, not `/login`.

**Not being chased further right now** — logging it so it isn't quietly
forgotten. `Sentry.setUser()` is now wired (every event should show which
user was affected going forward, previously always "Users: 0"), so if this
recurs, it should be traceable to a specific account next time instead of
anonymous. Revisit if it happens again.

## Open investigation — recurring `leads` anon-insert RLS breakage, pg_audit setup

4 confirmed occurrences of the same symptom ("new row violates row-level
security policy for table leads" on anon INSERT via the public Claim Grade
form): 2026-07-16, 2026-07-19, 2026-07-24, 2026-07-31. Three repair
migrations on record (`0008`, `0020`, `0030`), each re-asserting the same
policy/grant, each eventually followed by recurrence. Supabase support's
position on the open ticket: nothing on their platform auto-reverts RLS
without a trigger; they floated an unconfirmed theory that AI-driven
changes on our side might be reintroducing the broken state.

**Self-investigation findings (2026-08-03), checked before accepting that
theory:**

- **Deploy/CI pipeline: cleared.** `.github/workflows/ci.yml` runs
  typecheck/lint/test only — no database, migration, or Supabase-touching
  step of any kind. `package.json` has no `predeploy`/`postbuild`/
  seed/reset hooks. `vercel.json` has no `buildCommand` override. Vercel's
  build (`next build`) never touches the database, and per
  `supabase/migrations/README.md` there is no CLI/CI migration pipeline at
  all — every migration is a manual paste into the SQL Editor. This
  structurally rules out "a deploy step silently replays an old migration."
- **Old-migration replay: ruled out on logic, not just absence of a
  mechanism.** Every leads-related migration (`0006`, `0008`, `0013`,
  `0020`, `0026`, `0030`) is idempotent and additive (`if not exists`,
  `drop policy if exists` / `create policy`). Re-running any of them,
  even accidentally, would only re-assert the same correct anon-insert
  policy — it cannot explain a working policy going missing.
- **One real, direct hit:** `0013_leads_consent_unsubscribe.sql` (2026-07-19)
  altered the `leads` table with no `NOTIFY pgrst, 'reload schema'`
  statement — already documented in `supabase/migrations/README.md` as the
  confirmed cause of the second recurrence. This is the only one of the 4
  incidents with a clean, direct causal link to something in this repo.
- **The other 3 don't fit that same pattern.** The 2026-07-24 recurrence
  has *no* migration touching `leads`' schema or policies at all in the
  five days prior (`0014`–`0019` touch other tables only) — nothing in our
  own migration history explains that one. The 2026-07-31 recurrence has
  one candidate (`0026_grader_attribution.sql`, 2026-07-28, added 4 columns
  to `leads`) but it already includes `NOTIFY pgrst, 'reload schema'` and
  the gap is 3 days, not immediate — weaker evidence than `0013`, not a
  clean match. The very first (2026-07-16) occurred at/near `leads`' own
  initial creation (`0006`), before the `NOTIFY` convention existed at all.
- **Can't rule in or out:** whether an AI-driven session made a live,
  undocumented change outside the numbered-migration record. Git history
  can't distinguish this either way — every commit in this repo shares one
  author identity (`WholeClaim <benjaminhammonds@gmail.com>`), so there's
  no separate "Claude-authored commit" signal to check. Worth stating
  plainly: this Claude Code environment has never had live SQL execution
  access at any point — migrations are 100% manual-paste, per
  `supabase/migrations/README.md` — so if Supabase's theory means an agent
  with live DB credentials, that isn't this environment.

**pg_audit setup — APPLIED 2026-08-03.** `supabase/migrations/0032_pgaudit_leads_monitoring.sql`
ran clean in the SQL Editor ("Success. No rows returned"), with one fix
made during application: the draft's `create role if not exists ...` line
is invalid Postgres syntax (`CREATE ROLE` has no `IF NOT EXISTS` clause,
unlike `CREATE TABLE`/`CREATE EXTENSION`) — rewritten as a `DO $$ ... IF
NOT EXISTS (SELECT FROM pg_roles ...) THEN CREATE ROLE ...` block, which
is now reflected back into the migration file so the repo matches what's
actually live. Verified against Supabase's real pgaudit docs before
drafting, not assumed. Sets `pgaudit.log = 'ddl, role'` role-level
(Supabase doesn't expose postgresql.conf, so this is database-wide, not
scoped to `leads` alone — pgaudit's object-mode scoping only applies to
read/write auditing, not DDL/GRANT). Also sets up a secondary object-mode
role scoped to `leads` write traffic specifically. Manual verification
(pg_extension/pg_roles config check, then a reversible test-policy
create/drop checked against the Logs Explorer) in progress — pending
results. If a 5th occurrence happens, pull the `postgres_logs` audit trail
for that timestamp before attempting another repair — see the migration
file's own trailing comment block for the exact query.

## Code cleanup (not urgent)

- [ ] **Centralize the `isAdmin(email)` gate.** Duplicated inline in three
      places now: `src/app/library/actions.ts`, `src/app/library/page.tsx`,
      and `src/app/admin/page.tsx` (added 2026-07-24 for the beta monitoring
      page). Same 4-line function in each. Not a live risk today — all three
      copies are identical — but a future edit to the `ADMIN_EMAIL` check in
      one place and not the others would create a real gating inconsistency.
      Extract to a shared `src/lib/admin.ts` when convenient.
