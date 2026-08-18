-- =============================================================================
-- Migration 002 — public aggregate functions for the homepage modules
-- (Ticket 2: Newest Polls / Biggest Movers / Most Controversial)
--
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE DEPLOYING TICKET 2.
-- The app calls these two functions with the anon key; until they exist the
-- new homepage modules will render their error state, not crash the page.
--
-- Why new functions rather than reusing the admin ones: admin_poll_choice_totals()
-- and admin_poll_recent_activity() are granted to service_role ONLY, on purpose.
-- The homepage runs on the anon key. Rather than widen the admin grants — which
-- would blur the line the dashboard's security rests on — these are separate,
-- public-by-design functions that return strictly aggregate counts.
--
-- No new data is exposed. get_poll_results() already returns per-choice counts
-- to anon for a single poll; these return the same shape in bulk so the
-- homepage needs one round trip instead of 41. Neither touches voter_token or
-- ip_hash, and `votes` itself stays unreadable to anon
-- (revoke select, insert, update, delete on votes from anon, authenticated).
--
-- Both follow the hardening pattern established in schema.sql: SECURITY
-- DEFINER with an empty search_path and fully-qualified public.* references.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_poll_totals_bulk: per-choice counts for every poll in one call.
-- Powers "Most Controversial" (needs the spread across choices) and the vote
-- totals shown on "Newest Polls".
--
-- Result set is bounded by (polls x choices per poll) -- a few hundred rows at
-- most -- NOT by vote volume, so it cannot hit PostgREST's 1,000-row cap the
-- way a raw votes select would.
-- ---------------------------------------------------------------------------
create or replace function get_poll_totals_bulk()
returns table (poll_id text, choice_index int, vote_count bigint)
security definer
set search_path = ''
language sql stable
as $$
  select v.poll_id, v.choice_index, count(*) as vote_count
  from public.votes v
  join public.polls p on p.id = v.poll_id
  where p.status = 'published'
  group by v.poll_id, v.choice_index;
$$;

-- ---------------------------------------------------------------------------
-- get_recent_vote_counts: votes per poll within a trailing window.
-- Powers "Biggest Movers". p_hours is clamped server-side so a caller cannot
-- turn this into an unbounded full-table scan by passing a huge value.
--
-- Uses votes.created_at, which already exists and is already indexed
-- (votes_created_at_idx) -- no schema change was needed for this module.
-- ---------------------------------------------------------------------------
create or replace function get_recent_vote_counts(p_hours int default 24)
returns table (poll_id text, recent_votes bigint)
security definer
set search_path = ''
language sql stable
as $$
  select v.poll_id, count(*) as recent_votes
  from public.votes v
  join public.polls p on p.id = v.poll_id
  where p.status = 'published'
    and v.created_at > now() - (least(greatest(coalesce(p_hours, 24), 1), 168) || ' hours')::interval
  group by v.poll_id;
$$;

revoke all on function get_poll_totals_bulk from public;
revoke all on function get_recent_vote_counts from public;
grant execute on function get_poll_totals_bulk to anon, authenticated;
grant execute on function get_recent_vote_counts to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification — run these after and read the OUTPUT, don't infer from the
-- homepage rendering. Both should succeed and return zero rows while the
-- vote count is still zero; that is correct, not a failure.
-- ---------------------------------------------------------------------------
-- select * from get_poll_totals_bulk();
-- select * from get_recent_vote_counts(24);
--
-- Confirm they are callable by anon and that `votes` is still not:
-- select p.proname, p.prosecdef, p.proconfig
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('get_poll_totals_bulk','get_recent_vote_counts');
--
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_name = 'votes' and grantee in ('anon','authenticated');
-- -- expect ZERO rows
