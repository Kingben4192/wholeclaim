# Supabase Support Ticket Draft

**STATUS: DRAFT — NOT SENT. Awaiting founder review before submission.**

**Project ref:** hkjqyjhunfbdcnwyjaqd

**Subject:** PostgREST schema cache appears to go stale after migrations — recurring pattern across 4 incidents over 3 days, most recently on RLS enforcement rather than table visibility

**Summary:**

Since 2026-07-16 we've hit the same underlying symptom four separate times, across two different failure modes (missing grants, RLS rejection, and PostgREST losing visibility into specific tables entirely) but always in the same situation: a migration runs successfully, and shortly after, some subset of the schema misbehaves through PostgREST even though the underlying Postgres objects (grants, policies, tables) are correct. A manual `NOTIFY pgrst, 'reload schema';` has resolved it every time we've tried it, but it has recurred more than once even after a reload.

**Incident timeline:**

1. **2026-07-16 — missing grants (42501).** Every table except `deadlines` started returning `permission denied` for anon/authenticated/service_role, despite no grant changes in that migration. Patched by re-issuing `GRANT` statements and setting default privileges (migration `0007_repair_grants.sql`). Root cause not confirmed at the time.
2. **2026-07-16 — RLS rejection on `leads` (same day, after the grants fix).** Anon `INSERT` into `leads` was rejected by RLS despite the policy (`"leads: anon insert" ... for insert to anon with check (true)`) already existing exactly as needed, from the migration that created the table. Patched by dropping and recreating all three `leads` policies idempotently (migration `0008_repair_leads_policies.sql`). Root cause not confirmed at the time.
3. **2026-07-17 evening — PostgREST losing visibility into three specific tables.** `library_entries`, `ai_runs`, and `ai_ip_calls` — all created together in one migration — started returning `PGRST205` ("Could not find the table ... in the schema cache") via the service_role key, while every other table in the same schema stayed reachable throughout. A manual `NOTIFY pgrst, 'reload schema';` resolved it. It recurred later the same night with no schema changes in between except an unrelated migration touching a different table (`claims`, which stayed reachable throughout). This is the only incident where we captured precise request/response evidence (below).
4. **2026-07-19 — RLS rejection on `leads`, again.** Immediately after a migration (`0013_leads_consent_unsubscribe.sql`) added six new columns to `leads` via `ALTER TABLE ... ADD COLUMN`, the same anon `INSERT` began failing with `new row violates row-level security policy for table "leads"` — same symptom as incident #2, same table, different migration, no policy changes involved this time (the migration only added columns). A manual `NOTIFY pgrst, 'reload schema';` was run afterward; a follow-up anon insert succeeded, but since the insert also succeeded when we checked earlier (before the reload), that single before/after test can't independently prove the reload was what fixed it.

**Notification queue usage (checked post-incident, 2026-07-19):** after incident #4, we ran `select pg_notification_queue_usage();` directly and got `0` — the NOTIFY queue reads as empty/clean right now. We're flagging this as a new, separate data point rather than a conclusion: it was checked *after* the incident had already resolved, so a clean reading now doesn't tell us what the queue looked like at the moment the insert was actually rejected. We don't know whether queue pressure was involved in any of the four incidents — that's what we're asking about below.

**Reproduction (incident #3 — the only one with captured request/response evidence):**
```
Request: GET .../rest/v1/ai_runs?select=id&limit=1  (also library_entries, ai_ip_calls)
Auth: service_role key
Response: 404-equivalent PostgREST error
Body: {"code":"PGRST205","message":"Could not find the table 'public.ai_runs' in the schema cache"}
```
Meanwhile in the same window:
```
Request: GET .../rest/v1/claims?select=id&limit=1
Auth: same service_role key
Response: 200 OK
```

**What's confirmed vs. what's suspected:**

Confirmed: incident #3 happened exactly as described above — we have the exact request, response, and error code, and confirmed other tables in the same schema were unaffected at the same time.

Suspected, not proven: that incidents #1, #2, and #4 share the same root cause (PostgREST schema-cache staleness) as incident #3. We believe this because all four share the same shape — works, migration runs, something breaks with no corresponding code/policy defect, a manual reload resolves it — but for #1, #2, and #4 we do not have direct evidence (request/response capture, or Supabase-side logs) proving schema-cache staleness specifically caused those rejections, as opposed to some other transient cause. We don't have access to Auth/API logs that would show the exact rejected request for those three, which is part of what we're asking about below.

Also confirmed, but limited: `pg_notification_queue_usage()` returned `0` when we checked it just now. Also suspected, not proven: that this tells us anything about the queue's state *during* any of the four incidents — it was checked well after the fact in every case, so we can't rule notification-queue pressure in or out from this alone.

**Consistent pattern across all four:** working state → a migration runs → some subset of the schema misbehaves through PostgREST shortly after, with no corresponding defect in the underlying grants/policies/tables → a manual `NOTIFY pgrst, 'reload schema'` resolves it → in at least one case (#3), it recurred anyway later the same night.

**Questions for support:**

1. Should PostgREST's schema-cache reload be automatic after a migration/DDL change runs through the SQL Editor, or is a manual `NOTIFY pgrst, 'reload schema'` expected, documented behavior we should be building into our own migration process as a standard step? (We've now started doing this ourselves going forward, but want to know if that's actually necessary or if something else is going on.)
2. Is there a known cause for the cache to selectively affect specific tables/policies rather than the whole schema at once, and specifically to recur after being manually reloaded?
3. From your side, is there a way to check what actually caused each of these four rejections — particularly whether they were genuinely schema-cache misses, versus something else (e.g., connection pooler/PgBouncer state, a race between the migration transaction committing and PostgREST's next poll, etc.)? We'd like to close the loop on incidents #1, #2, and #4 with more than a pattern match.
4. Could NOTIFY-queue exhaustion be what's actually been causing these four incidents, rather than (or in addition to) generic schema-cache staleness? Our own post-incident check of `pg_notification_queue_usage()` came back `0`, but since that was checked after the fact, it doesn't rule out the queue being under pressure at the moment of each rejection. Can you check the queue's historical state from your side for the timestamps of these four incidents?
5. Should `pg_notification_queue_usage()` become a standard diagnostic we run before/after every migration going forward, alongside (or instead of) the manual `NOTIFY pgrst, 'reload schema'` we're currently doing? We'd rather build the right habit once than keep patching the symptom.

**Impact:** while incident #3 was active, our own application code's rate-limiting logic (which reads counts from `ai_runs`/`ai_ip_calls` before allowing an AI API call) failed open rather than closed — a query error was treated as "zero calls made yet." That's a bug on our side we're aware of and will harden regardless, but flagging as the practical impact: this wasn't just a display/logging issue, it silently disabled cost-attack protection on an AI-backed endpoint for as long as the cache stayed stale. Incidents #1, #2, and #4 blocked user-facing writes outright (signup-adjacent flows), which is a more visible failure but with no silent-degradation risk.
