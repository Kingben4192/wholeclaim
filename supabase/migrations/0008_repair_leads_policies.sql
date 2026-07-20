-- Repair: verified live (2026-07-16) that anon INSERT into `leads` was being
-- rejected by RLS despite 0006_grader.sql defining exactly this policy —
-- the public grader (the whole point of M4) couldn't actually submit.
-- Root cause unknown from here; this drops and recreates all three leads
-- policies idempotently so they're known-good regardless of what happened
-- the first time.

drop policy if exists "leads: anon insert" on leads;
drop policy if exists "leads: owner read by email" on leads;
drop policy if exists "leads: owner update by email" on leads;

create policy "leads: anon insert" on leads
  for insert to anon with check (true);

create policy "leads: owner read by email" on leads
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "leads: owner update by email" on leads
  for update to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
