-- Beta analytics instrumentation (proposal approved 2026-07-31), metric 1:
-- Free -> Pro conversion rate over time / time-to-convert. profiles.
-- subscription_status is current-state only -- nothing records WHEN a user
-- first converted, so there's no way to cohort conversion against signup
-- date. converted_at is set once, in src/lib/stripe/webhookHandlers.ts, on
-- the first event that represents a real conversion (subscription going
-- active, or a lifetime claim-unlock purchase) -- never overwritten after
-- that, so a later cancel/resubscribe doesn't erase the original
-- first-conversion timestamp.

alter table profiles
  add column if not exists converted_at timestamptz;

NOTIFY pgrst, 'reload schema';
