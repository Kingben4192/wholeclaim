-- Repair: this is at minimum the 4th occurrence of the exact same symptom
-- on this exact table -- "new row violates row-level security policy for
-- table leads" on anon INSERT via the public Claim Grade form. Prior
-- occurrences: 0008_repair_leads_policies.sql (2026-07-16),
-- 0013_leads_consent_unsubscribe.sql-adjacent (2026-07-19),
-- 0020_repair_leads_anon_insert.sql (2026-07-24) -- that last one added an
-- explicit `grant insert ... to anon` alongside the policy, theorizing the
-- base table-level GRANT (not just the RLS policy) might be the actual
-- thing silently reverting. 0023_security_advisor_hardening.sql confirmed
-- this was correctly in place as of that date, checked directly against
-- live pg_policies output, not just migration history. It is broken again
-- now (confirmed 2026-07-31 via three consecutive live anon-insert
-- attempts against production, not a file read).
--
-- Root cause remains unconfirmed after three prior repairs across two and
-- a half weeks. Reapplying 0020's fix verbatim rather than guessing at
-- something new -- if this recurs a 5th time, that's a strong signal the
-- problem isn't in this repo at all and is worth raising with Supabase
-- support directly, not repairing again from this side blind.

grant insert on leads to anon;

drop policy if exists "leads: anon insert" on leads;
create policy "leads: anon insert" on leads
  for insert to anon with check (true);

alter table leads enable row level security;

NOTIFY pgrst, 'reload schema';
