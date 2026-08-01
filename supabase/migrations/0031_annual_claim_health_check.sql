-- Annual Claim Health Check (Claim Grade A-Action-Center, approved
-- 2026-08-01). Deliberately NOT reusing claims.baseline_grade -- that's a
-- one-time snapshot from the original grader quiz, already powering the
-- existing before/after narrative (BeforeAfterGrade.tsx). This is a
-- separate, rolling "last annual check" comparison, unrelated to that
-- one-time value. Additive, nullable, no backfill -- same precedent as
-- claim_category (0019), signup_category (0021), label (0025): existing
-- claims get NULL and the cron treats a NULL last_annual_check_at the
-- same as "due now," which is the correct behavior for a first-ever run.

alter table claims
  add column if not exists last_annual_check_at timestamptz,
  add column if not exists last_annual_check_score integer,
  add column if not exists last_annual_check_grade text;

NOTIFY pgrst, 'reload schema';
