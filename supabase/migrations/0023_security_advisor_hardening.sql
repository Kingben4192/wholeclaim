-- Resolves 2 of 3 Security Advisor findings; the third (leads' anon-insert
-- policy) is left untouched -- confirmed via migration history (0006/0008/
-- 0020, unchanged since) and directly against live pg_policies output as
-- INSERT-only for anon, never SELECT/UPDATE/DELETE, so the "always-true
-- policy" warning is a false positive: no email is exposed via the anon
-- key.

-- 1. handle_new_user() is already `security definer set search_path =
-- public` (0001_init.sql) -- correctly hardened against search_path
-- attacks already. The remaining finding is that EXECUTE is still
-- grantable to public/anon/authenticated (Postgres's default on function
-- creation). Revoking it does not affect the trigger: Postgres resolves
-- and authorizes a trigger's function call at CREATE TRIGGER time (tied
-- to the table owner's privileges), not by checking the invoking
-- session's own EXECUTE grant each time the trigger fires -- so
-- on_auth_user_created continues to fire on every new auth.users row
-- exactly as before. This only blocks the (already-nonfunctional, since
-- it's a trigger-only function) direct-call/RPC path.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2. Fixed search_path on set_updated_at() -- same class of hardening
-- already applied to handle_new_user(), extended to this function. Purely
-- additive to the function's own definition; the two existing triggers
-- (claim_entitlements_set_updated_at, claim_guarantee_set_updated_at)
-- keep working unchanged.
alter function public.set_updated_at() set search_path = public;

NOTIFY pgrst, 'reload schema';
