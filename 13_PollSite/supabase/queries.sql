-- =============================================================================
-- Phase 1 internal measurement queries -- run these in the Supabase SQL
-- editor for the DEDICATED polling project. Read-only. Not exposed through
-- the public application, not accessible via the anon key, not tied to any
-- admin dashboard (none exists in Phase 1 by design).
--
-- Important framing: voter_token and ip_hash exist as ABUSE CONTROLS
-- (enforcing one vote per poll, rate limiting), not as an identity system.
-- These queries report counts and distinct-token totals -- they never
-- attempt to name, profile, or track a specific person across sessions.
-- Treat "distinct voter tokens" as an approximate participation signal,
-- the same way you'd read "unique visitors" on basic web analytics -- not
-- as a claim about who anyone is.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Total votes by poll
-- -----------------------------------------------------------------------------
select
  p.id as poll_id,
  p.category,
  p.question,
  count(v.id) as total_votes
from polls p
left join votes v on v.poll_id = p.id
group by p.id, p.category, p.question
order by total_votes desc;

-- -----------------------------------------------------------------------------
-- 2. Votes by choice, for a specific poll (swap the poll id)
-- -----------------------------------------------------------------------------
select
  choice_index,
  count(*) as votes
from votes
where poll_id = 'p16'   -- change to the poll you want to inspect
group by choice_index
order by choice_index;

-- -----------------------------------------------------------------------------
-- 3. Voting activity: last 24 hours vs. last 7 days, by poll
-- -----------------------------------------------------------------------------
select
  poll_id,
  count(*) filter (where created_at > now() - interval '24 hours') as votes_last_24h,
  count(*) filter (where created_at > now() - interval '7 days')   as votes_last_7d,
  count(*) as votes_all_time
from votes
group by poll_id
order by votes_last_24h desc;

-- -----------------------------------------------------------------------------
-- 4. Activity by category (join through polls)
-- -----------------------------------------------------------------------------
select
  p.category,
  count(v.id) as total_votes,
  count(v.id) filter (where v.created_at > now() - interval '24 hours') as votes_last_24h,
  count(v.id) filter (where v.created_at > now() - interval '7 days')   as votes_last_7d
from polls p
left join votes v on v.poll_id = p.id
group by p.category
order by total_votes desc;

-- -----------------------------------------------------------------------------
-- 5. Duplicate-vote attempts and other rejections
--    (requires vote_attempt_log -- see schema.sql; only rejected attempts
--    are logged here, successful votes are in `votes` itself)
-- -----------------------------------------------------------------------------
select
  reason,
  count(*) as attempts,
  count(*) filter (where created_at > now() - interval '24 hours') as attempts_last_24h
from vote_attempt_log
group by reason
order by attempts desc;

-- Rejections broken down by poll, if you want to see which polls are
-- attracting repeat-vote attempts specifically:
select
  poll_id,
  reason,
  count(*) as attempts
from vote_attempt_log
group by poll_id, reason
order by attempts desc;

-- -----------------------------------------------------------------------------
-- 6. Approximate distinct-voter participation per poll
--    (an aggregate count of distinct tokens -- NOT an identity lookup;
--    there is no query here that resolves a token back to a person)
--
--    Note: distinct_voters and total_votes will ALWAYS be equal here by
--    construction -- the database's unique(poll_id, voter_token) constraint
--    makes it structurally impossible for total_votes to exceed
--    distinct_voters for a given poll_id. This query is not a way to
--    detect a broken one-vote constraint (if the constraint itself were
--    ever dropped or bypassed, this comparison wouldn't catch that either,
--    since it would just reflect whatever got through). Use it as a plain
--    per-poll participation count, not as an integrity self-check.
-- -----------------------------------------------------------------------------
select
  poll_id,
  count(distinct voter_token) as distinct_voters,
  count(*) as total_votes
from votes
group by poll_id
order by distinct_voters desc;

-- Site-wide distinct participation across ALL polls (how many different
-- browsers have voted on at least one poll, at all):
select count(distinct voter_token) as distinct_voters_site_wide
from votes;

-- -----------------------------------------------------------------------------
-- 7. Quick Phase 1 scorecard -- the numbers that matter for the
--    "100 total votes" / participation threshold from the Phase 1 plan
-- -----------------------------------------------------------------------------
select
  (select count(*) from votes) as total_votes_site_wide,
  (select count(distinct voter_token) from votes) as distinct_voters_site_wide,
  (select count(distinct poll_id) from votes) as polls_with_at_least_one_vote,
  (select count(*) from vote_attempt_log where reason = 'already_voted') as duplicate_attempts_blocked;
