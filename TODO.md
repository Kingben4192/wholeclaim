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
