-- Beta analytics instrumentation (proposal approved 2026-07-31), metrics 3
-- and 7. Two event types only, purpose-built rather than a general-purpose
-- events pipeline -- four of the seven proposed metrics need no new
-- instrumentation at all (they're queries against ai_runs/files/auth.users/
-- storage_used_bytes, which already exist), so this stays narrow rather
-- than standing up a third-party analytics tool for two event types at
-- beta scale (5-10 users, per the existing /admin page's own comment).
--
-- event_type is intentionally unconstrained (no check constraint) -- a
-- CHECK enum here would need a migration every time a third event type is
-- added, unlike every OTHER enum in this schema (claim_category,
-- subscription_status, etc.) where the fixed set is itself the point.
-- This table's whole purpose is being the flexible one.
-- user_id is nullable with ON DELETE SET NULL, a deliberate departure from
-- this schema's usual "every user_id FK cascades" convention (see
-- src/app/api/account/delete/route.ts's own comment on that convention).
-- The account_deleted abandon-reason event is the reason: its whole value
-- is surviving the deletion it's logged at, for aggregate reporting
-- ("how many said X"), not per-user traceability -- if it cascaded, the
-- one event this table exists to capture for metric 7 would delete itself
-- the instant the account it describes is removed. Losing the user_id
-- link on deletion is the correct behavior here, not a gap: the person's
-- account and personal data are genuinely gone either way, matching the
-- Product Bible's "permanent deletion" promise.
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

-- Owner can insert their own events (uploadFile runs with the user's own
-- session, not the service-role client -- same reasoning as every other
-- user-initiated write in this schema). Deliberately NO select policy for
-- regular users: this table is write-only from their side. Reads are
-- admin-dashboard-only via the service-role client (src/app/admin/page.tsx),
-- which already bypasses RLS by design for that one gated page.
create policy "analytics_events: owner insert" on analytics_events
  for insert with check (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
