# Credential Remediation — 2026-08-13

**Status: rotation/remediation phase COMPLETE. Incident REMAINS OPEN** pending the verification tail in the final section.

**No full secret value appears in this record, or in any commit, at any point.** Prefixes only.

---

## 1. Exposure summary

Live credentials were found stored in plaintext inside `.claude/settings.local.json`, embedded as literal values within allowlisted `curl` commands retained from earlier debugging sessions.

| Credential | Prefix | Detail |
|---|---|---|
| Resend API key ("Onboarding") | `re_iDCdtSgV` | 36 chars, 2 occurrences. Used for ad-hoc `api.resend.com` calls. **Never the application key** — the app's key is separate and was never exposed. |
| Supabase personal access token #1 | `sbp_720b85eb` | 44 chars. Used in `PATCH /v1/projects/…/config/auth`. Account-scoped, write access to auth config. |
| Supabase personal access token #2 | `sbp_cab5dc7d` | 44 chars. Same endpoint and scope. |
| 48-char hex secret | `1b0fcdd4` | 2 occurrences, both `GET http://localhost:3000/api/cron/deadline-check`. Dev server only; never used against production. |

**Blast-radius note.** The exposure was local-disk only. The two Supabase PATs were the highest-severity item: account-scoped management tokens with demonstrated write access to project auth configuration.

---

## 2. Git history — clean

Verified across four independent checks:

| Check | Result |
|---|---|
| `.claude/settings.local.json` gitignored? | **Yes** — `.gitignore:42`, matched by explicit full path |
| Currently tracked? | **No** — unknown to the index |
| Ever tracked in history? | **No** — 0 commits touch that path |
| Any `sbp_` / `re_` pattern anywhere in history? | **None found** |

**No credential material ever entered git.** No history rewrite, force-push, or remote scrub was required.

---

## 3. Actions taken

**Revocations** (performed by Benjamin in the respective dashboards):
- Resend "Onboarding" key revoked.
- Both Supabase PATs revoked.

**Allowlist prunes** to `.claude/settings.local.json`, each with fresh backup → remove → verify valid JSON and zero unintended removals → delete backup:

| Pass | Removed | Entries |
|---|---|---|
| Resend | 2 | 125 → 123 |
| Supabase PATs | 2 | 123 → 121 |
| 48-char hex | 2 | 121 → 119 |

**Net 125 → 119.** Every pass verified zero unintended removals by diffing survivors against the backup.

**Backups deleted.** Both intermediate backups removed after verification — each contained credential material that was live when written. Zero backups remain.

**Final state of `.claude/settings.local.json`** — scanned for six credential classes, all zero:

`re_` 0 · `sbp_` 0 · long hex ≥32 0 · Bearer tokens 0 · Stripe keys 0 · JWTs 0

**Working-tree grep:** no `sbp_` occurrences anywhere outside that file.

---

## 4. Rotation record — `CRON_SECRET`

### Why it was rotated

The exposed 48-char hex matched the `CRON_SECRET` shape. Whether it was live in production **could not be determined by reading**: Vercel's Sensitive flag makes values write-only, so `vercel env pull` returns them empty. An earlier comparison that appeared to show "no match" was invalid — it compared against an empty read. Rotation was chosen over further inference.

### Custody model — persist-first

An earlier attempt (v2) generated the value into a shell variable and pushed it to Vercel **before** persisting it locally. Shell state did not survive, and Vercel could not read it back, leaving an **orphaned production secret known to nobody** (prefix `d952590f`). Nothing broke — Vercel injects `CRON_SECRET` into its own cron invocations — but the value was unrecoverable.

**v3 inverted the order: persist to `.env.local` first, verify by reading back from the file, and only then push that same value to Vercel.**

### Execution

| Step | Result |
|---|---|
| Gitignore pre-check | `.env.local` confirmed ignored before any write |
| Generate | `crypto.randomBytes(32).toString('hex')`, 64 chars |
| **Persist first** | Written to `.env.local`; **read back from file and confirmed byte-identical**; 20 keys preserved |
| Vercel **production only** | `env rm` → `env add --sensitive`, value sourced from `.env.local`. **Preview never touched** — it had no `CRON_SECRET` and no cron schedule targets it |
| Orphan-dead evidence | `vercel env ls` → **exactly one** row: `CRON_SECRET · Encrypted · Production`. One-value-per-name makes a single row structural proof the `d952590f` record is gone |
| Deploy | `dpl_8519Wc6vLoTcKThWQoxUNg8VuZ9g`, ready (explicit `vercel --prod`, Decision #46) |
| Probe | `GET /api/cron/leads-rls-check` with Bearer from `.env.local` → **HTTP 200** |

**Value prefix: `6437e1ea`, 64 chars.** No recovery of the `d952590f` orphan was attempted; it was overwritten.

### Apex-308 detour

The first probe was aimed at the apex domain and returned **308 Permanent Redirect** → `https://www.getwholeclaim.com/…`. The redirect is site-wide (`getwholeclaim.com/` → 308, `www.getwholeclaim.com/` → 200), so **the request never reached the route handler** — the 308 was neither a pass nor an auth failure. Redirects were deliberately not followed, since auth headers are commonly dropped across a redirect and would have produced a misleading 401. The probe was re-aimed at `www` and returned 200 on a single attempt.

**Probe target for future checks: `https://www.getwholeclaim.com/…`, not the apex.**

### What the 200 proves, and what it does not

The 200 confirms the **active production deployment converged on the persisted value**. Combined with the single-row `env ls`, it confirms the orphan is not the active production value.

It does **not** prove the Vercel **scheduler** leg works — scheduled invocations authenticate via Vercel's own injection, which this manual probe bypasses. That is the first pending row below.

Only `leads-rls-check` was probed. `deadline-check`, `tips`, and `annual-claim-check` execute real jobs and send real notifications; they were deliberately not touched.

---

## 5. Root cause and standing fix

**Root cause.** Secrets were embedded as **literal values** inside `curl` commands. When those commands were approved, the tooling persisted the full command string — credential included — into the allowlist, where it remained indefinitely.

**Standing fix — permanent practice, all future sessions:**

> **Debug and allowlisted `curl` commands must reference secrets via environment variable only, never as a literal.**
>
> Use `-H "Authorization: Bearer $CRON_SECRET"`, never `-H "Authorization: Bearer 1b0f…"`.
>
> A literal in a one-off command becomes a permanent plaintext record the moment it is approved.

Secondary practices confirmed by this incident:
- Persist-first custody for any generated credential — never push a value anywhere before it is stored somewhere readable.
- Never infer a secret's status from an empty read; Vercel Sensitive values are unreadable by design, and absence of data is not evidence of difference.

---

## 6. PENDING verification — incident remains OPEN

Rotation is complete. These four remain outstanding, and the incident is **not closed** until they are cleared.

| # | Item | Why |
|---|---|---|
| 1 | **Tomorrow's four scheduled cron 200s** — `deadline-check` 13:00, `tips` 14:00, `leads-rls-check` 15:00, `annual-claim-check` 16:00 UTC | Proves the **scheduler leg**, which the manual probe bypasses. Routes fail closed (401) and silently, so a broken scheduler would be invisible without this check. |
| 2 | **Supabase org audit review** | Determine whether either revoked PAT was used by anyone other than the owner before revocation. |
| 3 | **`supabase login` refresh** | Local CLI session may still hold a revoked token. |
| 4 | **Resend send-log scan** | Confirm the revoked "Onboarding" key sent nothing unexpected while exposed. |

---

*Record created 2026-08-13. Rotation/remediation phase complete; verification tail pending.*

---

# Evidence appendix — 2026-08-13 night

Read-only pass except where explicitly noted. No secret or key value was printed at any point.

## A. Supabase CLI credential custody — **ROW CLOSED**

| Check | Result |
|---|---|
| `supabase` CLI on PATH | **Not installed** |
| `npx supabase` | **Not installed as a package** — npx attempted to fetch `supabase@2.114.0` and cancelled |
| `SUPABASE_ACCESS_TOKEN` env var | **Not set** |
| Stored token file (5 standard profile paths) | **Absent at all** |
| `~/.supabase/` directory | Exists, contains only `telemetry.json` and an empty `traces/` — **no token file** |
| `supabase projects list` | **Could not run** — CLI unavailable |

**Conclusion: no credential was ever cached locally. Nothing to refresh.** The `supabase login` refresh row closes with no action required — the revoked PATs were used via `curl` against the management API, never through an authenticated CLI session.

## B. Resend send log — **CANNOT COMPLETE VIA API**

Live key read from `.env.local` (never printed), used against the Resend API read-only.

| Endpoint | Status | Response |
|---|---|---|
| `GET /emails` | **401** | `restricted_api_key` — *"This API key is restricted to only send emails"* |
| `GET /domains` | **401** | same |

**This is not a dead key.** The application key is alive and sending normally; it is scoped **send-only** with no read permission — correct least-privilege configuration. Production email is unaffected.

**Consequence:** the send-log scan cannot be performed programmatically with this key. It requires either the **Resend dashboard** or a separate read-scoped key. **Time window covered by this check: none** — zero send records were retrievable.

**This row remains OPEN** and moves to the pending list as a dashboard task.

## C. Cron route triage and manual execution

### C1. Handler side-effect analysis (static)

| Route | Send gate | External side effects |
|---|---|---|
| `deadline-check` | **NONE** | Sends **push notifications**; `delete` on `push_subscriptions`; `update` `reminder_sent_at` |
| `tips` | `TIPS_SENDING_ENABLED === "true"` | Sends **email** via Resend; `update` `tips_stage`, `last_tip_sent_at` |
| `leads-rls-check` | NONE | `insert` then `delete` of its **own probe row** — self-cleaning by design |
| `annual-claim-check` | `ANNUAL_CHECK_SENDING_ENABLED === "true"` | Sends **email**; `update` `last_annual_check_*` |

### C2. Production gate values

Pulled to a gitignored temp file (`.env.gatecheck.local`, gitignore verified **before** writing), read, then deleted — **deletion confirmed**.

| Flag | Production value | Effect |
|---|---|---|
| `TIPS_SENDING_ENABLED` | **Present but empty — marked Sensitive, unreadable** | **Gate state cannot be determined** |
| `ANNUAL_CHECK_SENDING_ENABLED` | **Not present** | `undefined === "true"` → `live = false` → gate **OFF** |

Dry-run path verified in source before invoking: with `live=false`, `annual-claim-check` records `dry-run: would email …` and `continue`s — **no send, no DB write**.

### C3. MANUAL AUTHENTICATED EXECUTION

> **These are MANUAL AUTHENTICATED EXECUTIONS, not scheduler-injection evidence.**
> Each was invoked by hand with a Bearer token read from `.env.local`. They prove the deployed handler accepts the rotated secret. They prove **nothing** about whether Vercel's scheduler injects it correctly — that remains unverified until the scheduled runs occur.

| Route | Result |
|---|---|
| `leads-rls-check` | **200** (recorded during rotation) |
| `annual-claim-check` | **200** — gate off, dry-run path, no send, no write |
| `deadline-check` | **SKIPPED** — no gate; sends real push notifications and mutates `push_subscriptions` |
| `tips` | **SKIPPED** — gate value unreadable, so "off" could not be confirmed; sends real email |

All requests to `https://www.getwholeclaim.com`, no redirect-follow, single attempt each.

## D. Pending — carried forward

| # | Item | Status |
|---|---|---|
| 1 | **Four scheduled cron 200s** (13:00 / 14:00 / 15:00 / 16:00 UTC) | **OPEN** — the only evidence that proves the **scheduler-injection leg**. Manual 200s above explicitly do not substitute. |
| 2 | **Supabase org audit-log review** | **OPEN — Benjamin** — *placeholder: result to be recorded here.* Determine whether either revoked PAT was used by anyone other than the owner before revocation. |
| 3 | `supabase login` refresh | **CLOSED** — see §A, no credential ever cached |
| 4 | **Resend send-log scan** | **OPEN — Benjamin, dashboard** — *placeholder: result to be recorded here.* API route unavailable (send-only key, §B). |
| 5 | **Vercel manual cron run** (optional) | **OPEN** — *placeholder: if Benjamin triggers a run from the Vercel dashboard, record route, timestamp and status here.* Would exercise the scheduler path ahead of the natural schedule. |

**Incident status: rotation/remediation COMPLETE; incident REMAINS OPEN on rows 1, 2, 4 (and optionally 5).**

*Appendix added 2026-08-13 night.*

---

# Correction and addendum — 2026-08-13 late

## E. Machine-state language — CORRECTED

**Earlier sections of this record state that `.claude/settings.local.json` was pruned to zero credential material. That remains true and is not retracted. But it was allowed to imply the machine was clean. It was not.**

Precise state:

- **Pruning cleaned one file.** It did not remove credential material from the machine.
- **Claude Code session transcripts (`~/.claude/**/*.jsonl`) retained full-length credential values** — written automatically whenever a command or file output containing a secret passed through a session. Pruning the settings file had no effect on them.
- **Retired transcripts were purged tonight** — see §F.
- **The current session's transcript still exists** and holds masked-workflow residue plus a small number of non-secret `.env.local` values (`ADMIN_EMAIL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`). **It is scheduled for manual deletion at session close** — it cannot delete itself while the session is live.
- **All future scans are repo-locked** to `c:\Users\benja\Documents\wholeclaim`. A profile-wide grep earlier tonight walked OneDrive-backed paths and triggered a files-on-demand hydration; scope was corrected immediately.

## F. Transcript exposure — the larger finding

A read-only sweep of all 18 transcript files (135.6 MB) found the transcripts, not the settings file, were the substantive exposure.

| Class | Occurrences |
|---|---|
| Dead / revoked material | 53 |
| **Live `.env.local` values** | **2,144** |
| Live generic classes (`eyJ…` JWT, `sk-ant`, Stripe `sk_`) | 256 |

Concentrated in five files, overwhelmingly one 124.1 MB transcript from a **prior** session, which held the service-role key, Stripe secret and webhook secrets, the Anthropic key, the live Resend key, VAPID private key, and the email hook secret — each many times over.

**Two findings worth preserving:**

1. **The rotated `CRON_SECRET` never entered any transcript.** Zero occurrences of the full value across all 18 files. Persist-first custody — generate, write to `.env.local`, read back, feed to Vercel via stdin, never echo — kept it out entirely. **This validates the custody model as the correct default.**
2. **The current session leaked no secret-class values.** 163 live hits, all non-secret identifiers. Masking discipline held where it was applied.

**Remediation:** deletion, not scrubbing. Retired transcripts were purged (§G). Editing them in place was rejected — a partially-scrubbed transcript is indistinguishable from a clean one.

## G. Retired transcript purge

**15 files, 130.4 MB deleted.** Each deletion individually verified; post-delete verification confirmed only the current session's 3 files remain.

Included: the 124.1 MB prior-session transcript, a 1.9 MB and a 2.1 MB session transcript (the latter under a different project directory), 11 subagent transcripts, and `history.jsonl`.

**Accepted cost:** resume history for those sessions is gone. Deliberate — deletion is the remediation regardless of dead/live counts.

## H. OneDrive scope — RESOLVED, repo is outside sync

A hydration popup during the profile-wide scan raised the question of whether credential files were syncing to the cloud. **They were not.**

The cause is a **two-Documents quirk**:

| Path | State |
|---|---|
| `C:\Users\benja\Documents` | **Real local directory** — no junction, no reparse point. **Repo lives here.** |
| `C:\Users\benja\OneDrive\Documents` | The KFM-redirected shell "Documents" |
| Shell `Personal` redirection | → `C:\Users\benja\OneDrive\Documents` |
| OneDrive KFM | Active (`KfmFoldersProtectedNow: 3584`) |
| `C:\Users\benja\OneDrive\Documents\wholeclaim` | **Does not exist** — no synced duplicate |

Known Folder Move redirected the *shell* Documents into OneDrive, but the legacy `C:\Users\benja\Documents` survived as a separate un-redirected folder — and that is where the repo sits.

Placeholder attributes for both credential files:

| File | Attributes | Offline | Reparse | Recall | Pinned |
|---|---|---|---|---|---|
| `.claude\settings.local.json` | `Archive` | ✗ | ✗ | ✗ | ✗ |
| `.env.local` | `Archive` | ✗ | ✗ | ✗ | ✗ |

Plain local files. **No credential material ever entered OneDrive sync scope.**

## I. Pending — updated

| # | Item | Status |
|---|---|---|
| 1 | Four scheduled cron 200s | **OPEN** — the only scheduler-injection evidence |
| 2 | Supabase org audit-log review | **OPEN — Benjamin** |
| 3 | `supabase login` refresh | **CLOSED** — no credential ever cached |
| 4 | Resend send-log scan | **OPEN — Benjamin, dashboard** (send-only key blocks the API route) |
| 5 | Vercel manual cron run (optional) | **OPEN** |
| 6 | **Current session transcript deletion** | **OPEN — Benjamin, at session close.** Command supplied in the session report. |

**Incident status: rotation COMPLETE, transcript purge COMPLETE, OneDrive question RESOLVED. Incident REMAINS OPEN on rows 1, 2, 4, 6.**

*Correction added 2026-08-13 late.*
