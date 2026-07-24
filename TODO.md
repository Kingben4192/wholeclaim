# TODO

## Post-launch security maintenance

Created 2026-07-24, after the Tier 1 security hardening deploy (commit `de9e88e`)
enabled Dependabot alerts. The push to `master` immediately surfaced:

**12 Dependabot vulnerabilities: 6 high, 6 moderate.** (github.com/Kingben4192/wholeclaim/security/dependabot)

- [ ] Review each of the 12 findings individually
- [ ] For each: determine exploitable vs non-exploitable in this app's actual usage
- [ ] For each: identify the upgrade path and assess breaking-change risk
- [ ] Patch in a controlled, deliberate update — do not blindly run a bulk dependency
      upgrade right before or during active beta testing
- [ ] Sequence this *after* the current production deploy is confirmed stable, not before

Dependabot's own version-update PRs (`.github/dependabot.yml`, weekly, npm +
GitHub Actions) will keep opening on their own regardless — this task is about
the *existing* 12 findings specifically, not the ongoing automated PRs.

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
