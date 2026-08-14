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
