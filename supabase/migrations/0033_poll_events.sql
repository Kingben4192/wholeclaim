-- Anonymous event instrumentation for the Property Record demand test
-- (property-record-poll.vercel.app).
--
-- Three parallel paths to the same $19 Gumroad offer, each separately
-- attributed so their conversion can be compared:
--   direct : landing page -> Gumroad            (control)
--   poll   : vote -> acknowledgment -> offer -> Gumroad, split by answer
--   qr     : printed/offline scan -> Gumroad
--
-- THIS TABLE HOLDS NO IDENTITY. There is deliberately no email, name, user_id,
-- IP address, user agent, cookie, device or session identifier, and no free
-- text. It stores which path, which answer (poll only), what happened, and
-- when. Lead capture remains off: this is counting, not collecting.
--
-- Writes arrive ONLY from this site's own serverless endpoints using the
-- service role key. There is intentionally no anon insert policy -- the
-- `leads` anon-insert path has broken four times (0008 / 0020 / 0030,
-- monitored by 0032) and this instrument does not need to repeat it.

create table if not exists poll_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  source      text not null,
  poll_option text,
  created_at  timestamptz not null default now(),

  constraint poll_events_event_type_check
    check (event_type in ('page_view', 'vote', 'offer_view', 'gumroad_click')),

  constraint poll_events_source_check
    check (source in ('direct', 'poll', 'qr')),

  constraint poll_events_poll_option_check
    check (poll_option is null or poll_option in ('yes_before', 'only_after')),

  -- An answer only exists on the poll path, and every poll vote must carry one.
  constraint poll_events_option_only_on_poll
    check (
      (source = 'poll' and (event_type = 'page_view' or poll_option is not null))
      or (source <> 'poll' and poll_option is null)
    )
);

comment on table poll_events is
  'Anonymous counters for the Property Record demand test. No identity of any kind is stored. Written only by this site''s serverless endpoints via the service role.';

create index if not exists poll_events_source_type_idx
  on poll_events (source, event_type, created_at desc);

create index if not exists poll_events_option_idx
  on poll_events (poll_option, event_type)
  where poll_option is not null;

create index if not exists poll_events_created_at_idx
  on poll_events (created_at desc);

alter table poll_events enable row level security;

-- No policies on purpose: with RLS on and no policy, anon and authenticated
-- can neither read nor write. The service role bypasses RLS, so the endpoints
-- still work.
revoke all on poll_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reporting
-- ---------------------------------------------------------------------------

-- Poll path, split by answer. Denominator is votes.
create or replace view poll_results as
select
  poll_option,
  count(*) filter (where event_type = 'vote')          as vote_count,
  count(*) filter (where event_type = 'offer_view')    as offer_view,
  count(*) filter (where event_type = 'gumroad_click') as gumroad_click,
  round(
    (count(*) filter (where event_type = 'gumroad_click'))::numeric
    / nullif(count(*) filter (where event_type = 'vote'), 0),
    4
  ) as gumroad_ctr
from poll_events
where source = 'poll' and poll_option is not null
group by poll_option;

comment on view poll_results is
  'Poll path only, per answer. gumroad_ctr = gumroad_click / vote_count.';

-- Path comparison. The denominator differs by path and that is deliberate:
--   direct -> page views (a visitor who saw the offer)
--   poll   -> votes      (a visitor who engaged with the instrument)
--   qr     -> none; a scan IS the click, so ctr is null by definition.
create or replace view source_results as
select
  source,
  count(*) filter (where event_type = 'page_view')     as page_view,
  count(*) filter (where event_type = 'vote')          as vote_count,
  count(*) filter (where event_type = 'offer_view')    as offer_view,
  count(*) filter (where event_type = 'gumroad_click') as gumroad_click,
  case source
    when 'direct' then round(
      (count(*) filter (where event_type = 'gumroad_click'))::numeric
      / nullif(count(*) filter (where event_type = 'page_view'), 0), 4)
    when 'poll' then round(
      (count(*) filter (where event_type = 'gumroad_click'))::numeric
      / nullif(count(*) filter (where event_type = 'vote'), 0), 4)
    else null
  end as gumroad_ctr
from poll_events
group by source;

comment on view source_results is
  'Per-path comparison. direct is the control. qr ctr is null because a scan and a click are the same event.';

create or replace view poll_totals as
select
  count(*) filter (where event_type = 'page_view')     as total_page_views,
  count(*) filter (where event_type = 'vote')          as total_voters,
  count(*) filter (where event_type = 'offer_view')    as total_offer_views,
  count(*) filter (where event_type = 'gumroad_click') as total_gumroad_clicks
from poll_events;

revoke all on poll_results   from anon, authenticated;
revoke all on source_results from anon, authenticated;
revoke all on poll_totals    from anon, authenticated;

-- Required by supabase/migrations/README.md: PostgREST caches the schema and
-- does not reliably see new tables/views without this. Repeated production
-- incidents (0007, 0008, and the 2026-07-17 support ticket) trace to skipping
-- it. Must be the last statement, in the same paste-and-execute action.
NOTIFY pgrst, 'reload schema';
