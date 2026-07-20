-- Repair: every table except `deadlines` was found missing standard grants
-- to anon/authenticated/service_role (Postgres error 42501, "permission
-- denied"), blocking the app entirely as of 2026-07-16. Root cause unknown
-- from here — this restores access and sets default privileges so future
-- `create table` migrations don't need this repeated by hand.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
