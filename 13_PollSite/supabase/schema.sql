-- =============================================================================
-- What Do People Think? -- polling backend schema
--
-- Deploy target: a DEDICATED Supabase project for this product, separate
-- from WholeClaim's project. Do not add these tables to the WholeClaim
-- Supabase instance -- separate legal/risk surface (Phase 1 governance),
-- separate credentials, separate blast radius if something goes wrong here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- polls: curated poll definitions. Written by an admin/curator only, never
-- by end users (Phase 1 rule: no user-created polls).
-- ---------------------------------------------------------------------------
create table if not exists polls (
  id text primary key,                    -- e.g. 'p16', matches the app's poll id
  category text not null,
  question text not null,
  choices jsonb not null,                 -- ["Choice A", "Choice B", ...]
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  source_label text,
  source_url text,
  promotion jsonb,                        -- { "label": "...", "url": "..." } or null
  publish_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- votes: one row per vote, not a mutable counter. This is what makes totals
-- authoritative and auditable -- counts are always derived by counting rows,
-- never incremented client-side.
-- ---------------------------------------------------------------------------
create table if not exists votes (
  id bigint generated always as identity primary key,
  poll_id text not null references polls(id),
  choice_index int not null,
  voter_token uuid not null,              -- anonymous per-browser token, see below
  ip_hash text,                            -- salted hash, never raw IP -- for rate limiting/abuse review only
  created_at timestamptz not null default now(),

  -- One vote per poll per anonymous voter token. This is the server-side
  -- version of "one vote per browser" -- the token lives in an httpOnly
  -- cookie set by the server, not in window.storage/localStorage, so it
  -- can't be edited by the client the way the demo's local flag could.
  unique (poll_id, voter_token)
);

create index if not exists votes_poll_id_idx on votes (poll_id);
create index if not exists votes_created_at_idx on votes (created_at);
create index if not exists votes_ip_hash_created_idx on votes (ip_hash, created_at);

-- ---------------------------------------------------------------------------
-- vote_attempt_log: records REJECTED vote attempts only (duplicate,
-- rate-limited, invalid poll/choice, expired/unpublished poll, and
-- malformed-request-level rejections logged by the API route before the
-- request ever reaches Postgres -- see app/api/polls/vote/route.js).
-- Successful votes are already captured in `votes` itself -- this table
-- exists purely so Phase 1 measurement can answer "how many
-- duplicate/abuse/probing attempts happened" without needing to
-- reconstruct that from application logs.
-- Written server-side only (via the service role key in the API route),
-- never by the anon client.
-- ---------------------------------------------------------------------------
create table if not exists vote_attempt_log (
  id bigint generated always as identity primary key,
  poll_id text,
  reason text not null,                   -- 'already_voted' | 'rate_limited' | 'invalid_choice_index' | 'poll_not_found' | 'poll_not_published' | 'poll_not_yet_live' | 'poll_expired' | 'invalid_request_body' | 'invalid_poll_id'
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists vote_attempt_log_created_idx on vote_attempt_log (created_at);
create index if not exists vote_attempt_log_reason_idx on vote_attempt_log (reason);
-- Added for isIpOverAttemptLimit() in app/api/polls/vote/route.js, which
-- runs a `.eq("ip_hash", ...).gte("created_at", ...)` lookup on EVERY
-- request to this route (not just successful votes) to enforce the
-- per-IP logging rate limit. Without this composite index, that query
-- scans the full table as vote_attempt_log grows -- a cost that compounds
-- specifically because this table is now checked on every request,
-- rejected or not.
create index if not exists vote_attempt_log_ip_hash_created_idx on vote_attempt_log (ip_hash, created_at);

alter table vote_attempt_log enable row level security;
-- No policies granted to anon/authenticated at all -- this table is for
-- internal Supabase SQL-editor measurement only (Step 6), never read or
-- written through the public application or its anon key.

-- ---------------------------------------------------------------------------
-- Row Level Security. The browser (anon key) can only ever SELECT poll
-- results and INSERT its own vote through the RPC function below -- it can
-- never UPDATE or DELETE a vote, and can never read another voter's token.
-- ---------------------------------------------------------------------------
alter table polls enable row level security;
alter table votes enable row level security;

create policy "polls are publicly readable when published"
  on polls for select
  using (status = 'published');

-- No direct insert/update/delete policies on votes for the anon role.
-- All writes to `votes` happen through the SECURITY DEFINER function below,
-- which enforces validation, one-vote-per-token, and rate limiting server-side.
-- (Do not add an "insert" policy here -- that would let the client bypass
-- the function and write arbitrary rows.)
--
-- Intentionally NO select policy is granted on `votes` to anon/authenticated.
-- voter_token and ip_hash must never be readable by the client -- results
-- are exposed exclusively through get_poll_results() below, which runs as
-- SECURITY DEFINER so it can read `votes` on the caller's behalf without
-- the raw table ever being queryable directly. Do not add a permissive
-- "using (true)" select policy on `votes` -- that would leak voter_token
-- and ip_hash to the anon key, defeating the point of this function.
--
-- Explicitly revoking SELECT, INSERT, UPDATE, and DELETE here (not just
-- SELECT) is deliberate defense-in-depth: RLS restricts which rows a
-- policy-less role can touch, but the role also needs table-level
-- privilege in the first place. Whatever Supabase's default grants happen
-- to be on this project, this makes the intended access model explicit and
-- self-contained rather than relying on defaults staying as expected.
revoke select, insert, update, delete on votes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_poll_results: authoritative, server-computed totals. This is what
-- votingService.getPollResults() should call.
--
-- security definer + set search_path = '' with fully-qualified (public.*)
-- object references: without SECURITY DEFINER, this would silently return
-- zero rows for every poll now that anon SELECT is revoked on `votes`
-- above. An empty search_path (rather than `search_path = public`) plus
-- explicit schema-qualification is the stronger, Postgres-recommended
-- hardening for SECURITY DEFINER functions -- it removes any ambiguity
-- about whether an unqualified reference could resolve against a
-- different schema (including a session's temp schema) that the calling
-- role has write access to. Every SECURITY DEFINER function in this file
-- follows this same pattern.
-- ---------------------------------------------------------------------------
create or replace function get_poll_results(p_poll_id text)
returns table (choice_index int, vote_count bigint)
security definer
set search_path = ''
language sql stable
as $$
  select choice_index, count(*) as vote_count
  from public.votes
  where poll_id = p_poll_id
  group by choice_index
  order by choice_index;
$$;

-- ---------------------------------------------------------------------------
-- submit_vote: the ONLY way a vote gets recorded. Runs server-side with
-- elevated privilege (SECURITY DEFINER) so it can validate against `polls`
-- and enforce the unique constraint, while the anon client itself has no
-- direct write access to `votes`.
--
-- Validates: poll exists, is published, is within its publish/expire
-- window, and the choice index is in range. Duplicate (poll_id, voter_token)
-- votes are rejected by the unique constraint and surfaced as a friendly
-- error rather than a raw DB exception.
-- ---------------------------------------------------------------------------
create or replace function submit_vote(
  p_poll_id text,
  p_choice_index int,
  p_voter_token uuid,
  p_ip_hash text
)
returns table (choice_index int, vote_count bigint)
security definer
set search_path = ''
language plpgsql
as $$
declare
  v_poll public.polls%rowtype;
  v_choice_count int;
begin
  select * into v_poll from public.polls where id = p_poll_id;

  if v_poll is null then
    raise exception 'poll_not_found';
  end if;

  if v_poll.status <> 'published' then
    raise exception 'poll_not_published';
  end if;

  if v_poll.publish_at is not null and v_poll.publish_at > now() then
    raise exception 'poll_not_yet_live';
  end if;

  if v_poll.expires_at is not null and v_poll.expires_at < now() then
    raise exception 'poll_expired';
  end if;

  v_choice_count := jsonb_array_length(v_poll.choices);
  if p_choice_index < 0 or p_choice_index >= v_choice_count then
    raise exception 'invalid_choice_index';
  end if;

  -- Rate limit: block if this ip_hash has submitted more than 20 votes in
  -- the last 60 seconds, across any poll. Tune as real traffic informs it.
  if p_ip_hash is not null then
    if (select count(*) from public.votes
        where ip_hash = p_ip_hash
        and created_at > now() - interval '60 seconds') >= 20 then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into public.votes (poll_id, choice_index, voter_token, ip_hash)
  values (p_poll_id, p_choice_index, p_voter_token, p_ip_hash);
  -- unique (poll_id, voter_token) will raise a unique_violation here if this
  -- token already voted on this poll -- surfaced to the API layer as a
  -- clear "already voted" case, not a generic 500.

  return query select * from public.get_poll_results(p_poll_id);
end;
$$;

-- Lock down execute permissions: only the anon/authenticated roles calling
-- through Supabase's RPC interface should be able to call this, not PUBLIC
-- at the Postgres role level in a way that bypasses Supabase's own grants.
revoke all on function submit_vote from public;
grant execute on function submit_vote to anon, authenticated;
grant execute on function get_poll_results to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin-only aggregate functions, used exclusively by the /admin dashboard
-- (lib/adminQueries.js) via the service-role client. NOT granted to
-- anon/authenticated -- only the service_role can execute these. Supabase's
-- service_role bypasses RLS/grants for direct table access already, but
-- these are still declared explicitly rather than relying on that, so a
-- future permissions change elsewhere can't accidentally expose them.
-- ---------------------------------------------------------------------------
create or replace function admin_poll_vote_totals()
returns table (poll_id text, total_votes bigint)
security definer
set search_path = ''
language sql stable
as $$
  select poll_id, count(*) as total_votes
  from public.votes
  group by poll_id;
$$;

create or replace function admin_poll_recent_activity(p_hours int default 24)
returns table (poll_id text, recent_votes bigint)
security definer
set search_path = ''
language sql stable
as $$
  select poll_id, count(*) as recent_votes
  from public.votes
  where created_at > now() - (p_hours || ' hours')::interval
  group by poll_id;
$$;

-- Powers app/admin/page.js's full per-poll breakdown (dashboard item 7) and
-- category totals (item 8) without pulling every individual vote row into
-- application code. Result set is bounded by (number of polls x choices
-- per poll), not by total vote count -- this is what fixed the
-- PostgREST 1,000-row default cap silently truncating results once total
-- votes passed that threshold.
create or replace function admin_poll_choice_totals()
returns table (poll_id text, choice_index int, vote_count bigint)
security definer
set search_path = ''
language sql stable
as $$
  select poll_id, choice_index, count(*) as vote_count
  from public.votes
  group by poll_id, choice_index;
$$;

revoke all on function admin_poll_vote_totals from public, anon, authenticated;
revoke all on function admin_poll_recent_activity from public, anon, authenticated;
revoke all on function admin_poll_choice_totals from public, anon, authenticated;
grant execute on function admin_poll_vote_totals to service_role;
grant execute on function admin_poll_recent_activity to service_role;
grant execute on function admin_poll_choice_totals to service_role;

-- ---------------------------------------------------------------------------
-- get_poll_choice_count: small helper so the API route can size the
-- returned counts array to the poll's ACTUAL number of choices, rather than
-- inferring array length from whichever choice indexes happen to have
-- votes so far (a 4-choice poll with votes only on index 1 must still
-- report a 4-element array, not a 2-element one).
-- ---------------------------------------------------------------------------
create or replace function get_poll_choice_count(p_poll_id text)
returns int
security definer
set search_path = ''
language sql stable
as $$
  select jsonb_array_length(choices) from public.polls where id = p_poll_id;
$$;

grant execute on function get_poll_choice_count to anon, authenticated;
