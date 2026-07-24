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
