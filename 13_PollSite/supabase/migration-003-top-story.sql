-- =============================================================================
-- Migration 003 — top_story_candidates (Ticket 3)
--
-- RUN IN THE SUPABASE SQL EDITOR. Run migration-002 first if you haven't.
--
-- Holds drafted candidates awaiting human review. Approved candidates become
-- ordinary rows in `polls`; this table is the staging area and the audit trail
-- of what was proposed, including what was rejected and why.
--
-- Internal only. RLS is enabled with ZERO policies and grants are revoked from
-- anon/authenticated — the same posture as vote_attempt_log. Candidates are
-- unreviewed machine output; none of it should be reachable with the public
-- key, even accidentally.
-- =============================================================================

create table if not exists top_story_candidates (
  id                bigint generated always as identity primary key,

  run_date          date not null default current_date,

  -- The proposal itself.
  question          text not null,
  choices           jsonb not null,
  category          text not null,

  -- Provenance. source_url is what the reviewer clicks to check the framing
  -- against the actual story rather than trusting the summary.
  source_label      text,
  source_url        text,

  -- Why the filter let it through. Shown verbatim in the review UI so the
  -- founder audits the REASONING, not just a pass/fail verdict.
  rationale         text,

  -- Deterministic filter output, stored so a bad approval can be traced back
  -- to what the filter did or didn't catch at the time.
  hard_fails        jsonb not null default '[]'::jsonb,
  soft_flags        jsonb not null default '[]'::jsonb,

  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected','parked')),

  -- Set when approved: the polls.id this became. 'parked' candidates also get
  -- one -- they are written to `polls` as status='draft' so they re-enter the
  -- existing draft review flow rather than rotting in a private queue.
  published_poll_id text references polls(id),

  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists tsc_run_date_idx on top_story_candidates (run_date desc);
create index if not exists tsc_status_idx on top_story_candidates (status);

-- Grouping key for the review UI. The Flock example is the reason this exists:
-- one story yielded four candidates, and reviewing them as four unrelated
-- cards is a different (worse) task than reviewing them as one story with four
-- angles. Candidates from the same run + same source group together.
create index if not exists tsc_group_idx on top_story_candidates (run_date, source_url);

alter table top_story_candidates enable row level security;
-- Intentionally NO policies for anon/authenticated. Service role only.
revoke select, insert, update, delete on top_story_candidates from anon, authenticated;

-- =============================================================================
-- Verification — run these and read the OUTPUT.
-- =============================================================================
-- Table exists, RLS on, and NO policies:
--   select relname, relrowsecurity from pg_class where relname = 'top_story_candidates';
--   select count(*) from pg_policies where tablename = 'top_story_candidates';   -- expect 0
--
-- Public roles hold no grants:
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_name = 'top_story_candidates' and grantee in ('anon','authenticated');
--   -- expect ZERO rows
