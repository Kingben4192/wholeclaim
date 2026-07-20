-- WholeClaim M5: web push subscriptions + dedupe tracking for deadline reminders.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions: owner all" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tracks whether a reminder has already gone out for a deadline so the daily
-- cron doesn't re-notify every day it stays within the reminder window.
alter table deadlines
  add column if not exists reminder_sent_at timestamptz;
