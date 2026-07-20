-- Read-only diagnostic v2 — run in the SQL Editor and paste back the result.
-- Not a migration; not meant to be committed to the migrations/ folder.

-- 1. Every policy on leads, including whether it's PERMISSIVE or RESTRICTIVE
-- (a RESTRICTIVE policy ANDs with every permissive one — this is the
-- likeliest reason a with_check:true permissive policy can still lose).
select
  policyname,
  permissive,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where tablename = 'leads'
order by permissive, policyname;

-- 2. Whether RLS is enabled and/or forced on the table.
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname = 'leads';

-- 3. Any triggers on leads that might reject inserts independently of RLS.
select tgname, tgenabled, tgtype
from pg_trigger
where tgrelid = 'public.leads'::regclass and not tgisinternal;
