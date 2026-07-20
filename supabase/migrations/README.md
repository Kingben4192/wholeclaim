# Migration process

Migrations are plain numbered `.sql` files, applied by pasting the full file
into the Supabase SQL Editor and running it. There is no CLI/CI pipeline —
this is a manual, human-run step every time.

## Every migration must end with a schema reload

```sql
NOTIFY pgrst, 'reload schema';
```

Add this as the last statement in every new migration file, so it always
runs in the same paste-and-execute action as the migration itself — not a
separate step someone has to remember.

**Why this is required, not optional:** PostgREST (Supabase's REST API
layer) caches the database schema and does not reliably pick up new
columns, tables, or policy context immediately after DDL changes. This has
caused real, repeated production incidents:

- `0007_repair_grants.sql` — every table except `deadlines` came up with
  `permission denied` (42501), root cause never confirmed at the time.
- `0008_repair_leads_policies.sql` — anon INSERT into `leads` was rejected
  by RLS despite the correct policy already existing from `0006_grader.sql`,
  root cause never confirmed at the time.
- A separate, more thoroughly diagnosed incident (`supabase-support-ticket-draft.md`,
  2026-07-17) found PostgREST's schema cache selectively losing visibility
  into `library_entries`, `ai_runs`, and `ai_ip_calls` — all three created
  in one migration — while the rest of the schema stayed reachable. A
  manual `NOTIFY pgrst, 'reload schema'` resolved it, but it recurred later
  the same night.
- `0013_leads_consent_unsubscribe.sql` — the same `leads` RLS symptom
  recurred again (2026-07-19), with no reload statement anywhere in the
  migration.

Three incidents, three different migrations, same underlying pattern. This
is cheap, harmless to run even when not strictly needed, and turns a
recurring after-the-fact diagnosis into a step that just always happens.

## Also check notification queue usage — but this does not replace the reload

```sql
select pg_notification_queue_usage();
```

Run this before a migration (and again after, if anything looks off) to see
how full Postgres's LISTEN/NOTIFY queue is (0 = empty, 1 = full). This is a
**read-only diagnostic** — it reports a number, it doesn't trigger a reload
or fix anything by itself. It's being added here as a precaution while
`supabase-support-ticket-draft.md` (which asks Supabase directly whether
notification-queue pressure explains these incidents) is still unanswered —
a post-incident check on 2026-07-19 came back `0` (clean), which doesn't
confirm or rule out queue pressure at the actual moment of any past
rejection, since it was checked after the fact each time.

`NOTIFY pgrst, 'reload schema'` above remains the actual fix — it's the one
step that has empirically resolved every incident so far. Revisit this
section once Supabase responds to the ticket; if they confirm queue
exhaustion is the real mechanism, the reload step may need to change (e.g.
to something that also drains the queue), not just gain a diagnostic
alongside it.
