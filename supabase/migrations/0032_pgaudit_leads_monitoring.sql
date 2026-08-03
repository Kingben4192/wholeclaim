-- pg_audit setup for the recurring `leads` anon-insert RLS breakage
-- (4 confirmed occurrences: 2026-07-16, 2026-07-19, 2026-07-24,
-- 2026-07-31 -- see supabase/migrations/README.md and 0008/0020/0030).
-- Investigation task, not a repair -- if this table's anon-insert policy
-- breaks a 5th time, this is what lets us pull the exact statement and
-- role that changed it instead of guessing again.
--
-- Verified against Supabase's own pgaudit documentation
-- (supabase.com/docs/guides/database/extensions/pgaudit) before drafting
-- this -- not assumed. Two real constraints from that doc shape what
-- follows:
--
-- 1. Supabase restricts pgaudit configuration to role-level GUCs (`alter
--    role ... set ...`) -- there is no postgresql.conf access on managed
--    Postgres, so this cannot be scoped at the database/system level.
-- 2. pgaudit's object-mode scoping (the mechanism that limits logging to
--    one specific table) only applies to READ/WRITE auditing, not DDL.
--    There is no pgaudit mechanism that scopes CREATE/ALTER/DROP POLICY
--    or GRANT/REVOKE logging to a single table -- DDL logging is
--    inherently session-wide. This migration logs DDL and role/privilege
--    changes for the whole database, not `leads` alone. Given how
--    infrequently DDL actually runs on this project (migrations are
--    applied by hand, one at a time -- see README.md), the volume this
--    produces is expected to stay small, not noisy.

create extension if not exists pgaudit;

-- ddl:  CREATE/ALTER/DROP, including CREATE POLICY / DROP POLICY on any
--       table -- this is what would catch a policy being dropped or
--       recreated differently.
-- role: GRANT/REVOKE -- this is what would catch the anon INSERT grant
--       itself being revoked, which 0020's own comment already flagged
--       as a live theory (the grant reverting, not just the policy).
alter role postgres set pgaudit.log = 'ddl, role';

-- Object-mode logging, additive to the above: scoped WRITE auditing on
-- `leads` specifically. This does NOT catch policy/grant changes (see
-- note above) -- it catches actual row-level INSERT/UPDATE/DELETE
-- traffic against the table, which is a different, secondary signal
-- (e.g. confirming anon inserts are actually reaching the table between
-- breakages, or catching an unexpected write path). Kept separate from
-- the ddl/role logging above rather than folded into pgaudit.log
-- directly, since object-mode requires its own role.
--
-- Corrected 2026-08-03, as actually applied: `create role if not exists`
-- is not valid Postgres syntax -- unlike `create table`/`create
-- extension`, `CREATE ROLE` has no `IF NOT EXISTS` clause. Original draft
-- had this wrong; the DO block below is the real, applied version.
do $$
begin
  if not exists (select from pg_roles where rolname = 'wholeclaim_leads_audit') then
    create role wholeclaim_leads_audit noinherit;
  end if;
end
$$;
grant insert, select, update, delete on leads to wholeclaim_leads_audit;
alter role postgres set pgaudit.role to 'wholeclaim_leads_audit';

-- Not a schema change PostgREST's cache tracks (no table/column/policy
-- shape changed here), so this NOTIFY isn't load-bearing the way it is
-- in a normal migration -- included anyway to match this repo's
-- established convention (README.md) rather than making this file an
-- exception.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- MANUAL STEP -- founder must run these separately, after applying the
-- above. Cannot be scripted: this environment has no way to execute SQL
-- directly (see supabase/migrations/README.md), and step 2 specifically
-- requires observing a real committed change, not just running a query.
-- ============================================================
--
-- 1. Confirm the extension and role settings actually took effect:
--
--      select * from pg_extension where extname = 'pgaudit';
--      select rolname, rolconfig from pg_roles where rolname = 'postgres';
--
--    rolconfig should show both pgaudit.log=ddl, role and
--    pgaudit.role=wholeclaim_leads_audit.
--
-- 2. Confirm logging actually captures a DDL/policy event (Part 1, "confirm
--    via a trivial reversible change" -- the task explicitly asked for a
--    reversible change, not a repeat of any real repair):
--
--      create policy "pgaudit_test_policy" on leads for select to authenticated using (false);
--      drop policy "pgaudit_test_policy" on leads;
--
--    Then check the Logs Explorer (Dashboard -> Logs -> Postgres Logs)
--    with:
--
--      select cast(t.timestamp as datetime) as timestamp, event_message
--      from postgres_logs as t
--      where event_message like 'AUDIT%'
--      order by timestamp desc
--      limit 20;
--
--    Both the CREATE POLICY and DROP POLICY statements should appear.
--    If neither shows up, the config didn't take -- report back before
--    relying on this for anything, rather than assuming it's working.
