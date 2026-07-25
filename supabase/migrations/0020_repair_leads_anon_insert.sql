-- Repair: live production reproduction (2026-07-24) of "new row violates
-- row-level security policy for table leads" on anon INSERT via the public
-- Claim Grade form -- this is the third time this exact symptom has hit
-- `leads` (see supabase/migrations/README.md: 0008_repair_leads_policies.sql
-- on 2026-07-16, then again around 0013_leads_consent_unsubscribe.sql on
-- 2026-07-19). Root cause still unconfirmed: migrations are applied by hand
-- with no drift-detection between these files and live database state, and
-- PostgREST's schema cache has separately been shown to lose track of
-- policy/grant state after DDL changes without an explicit reload.
--
-- Idempotently re-asserts the anon insert grant and policy, narrowly scoped
-- to `leads` only -- not a repeat of 0007's sweeping all-tables grant, and
-- does not touch read/update/delete access for anon in any way.

grant insert on leads to anon;

drop policy if exists "leads: anon insert" on leads;
create policy "leads: anon insert" on leads
  for insert to anon with check (true);

alter table leads enable row level security;

NOTIFY pgrst, 'reload schema';
