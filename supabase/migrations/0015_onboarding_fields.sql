-- Onboarding flow (Step 2 of the onboarding build): two additive, nullable
-- fields. Both are pure data capture -- neither is read by the scoring
-- engine (src/lib/scoring/documentationScore.ts remains the sole authority
-- for Claim Grade/Documentation Score). No default, no backfill, no
-- existing row touched.
--
-- profiles.onboarding_seen_at: has this user dismissed the welcome flow.
-- UI state only.
--
-- claims.date_discovered: captured in the Claim Creation Wizard's Step 2,
-- for claims where discovery lags the loss event (e.g. water/mold). Not
-- wired into Timeline Integrity or any other formula in this step -- that
-- would be a separate, explicitly-approved scoring-engine change, not a
-- side effect of a data-model migration.

alter table profiles
  add column if not exists onboarding_seen_at timestamptz;

alter table claims
  add column if not exists date_discovered date;

-- Required by supabase/migrations/README.md -- PostgREST's schema cache
-- has caused three separate real incidents (0007, 0008, 0013) where new
-- columns weren't visible until this ran.
NOTIFY pgrst, 'reload schema';
