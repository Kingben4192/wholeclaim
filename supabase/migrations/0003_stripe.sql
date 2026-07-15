-- WholeClaim M3: pricing cohort for the $49 one-time vs $19/month A/B test
-- (Decision Log #16 — Open, decide beta week 2). Assigned once per user on
-- first checkout attempt and held stable afterward.

alter table profiles
  add column if not exists pricing_cohort text
  check (pricing_cohort in ('onetime', 'subscription'));
