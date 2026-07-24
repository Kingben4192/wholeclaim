-- Security fixes: the two approved LOW findings from the 2026-07-24
-- security review.

-- 1. Lightweight per-IP rate limiting for anonymous `leads` inserts (the
-- public Claim Grade signup form has no auth wall). Mirrors the existing
-- ai_ip_calls pattern (0002_ai.sql) -- a dedicated counter table, checked
-- and inserted through the service-role client only. Unlike ai_ip_calls'
-- original version, no authenticated/anon policy is added at all here, so
-- this starts in the already-correct posture rather than repeating that
-- fix later.
create table if not exists lead_ip_calls (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

alter table lead_ip_calls enable row level security;
-- No policies: table is reachable only via the service-role client, which
-- bypasses RLS by default.

-- 2. Unused column from the retired "Gold tier" / A/B pricing-cohort idea
-- (0003_stripe.sql). Confirmed via repo-wide search: referenced nowhere
-- outside its own defining migration -- no application code reads or
-- writes it, no other migration depends on it.
alter table profiles drop column if exists pricing_cohort;

NOTIFY pgrst, 'reload schema';
