-- Source Attribution, Phase 1 Beta Instrumentation (Option A). Attribution
-- attaches to `leads` at grade-completion time -- the earliest persistence
-- point that actually exists (confirmed: submitGrade() requires
-- name+email+consent before anything is written; there is no earlier
-- anonymous record to attach to). Forwarded to `claims` on conversion via
-- the same claim/from-grade/route.ts mechanism that already forwards
-- baseline_grade/us_state/damage_category. Additive, nullable, no
-- backfill -- same precedent as claim_category (0019), signup_category
-- (0021).
--
-- attribution_source is included but not yet written by any code path --
-- the self-report UI/action that would populate it was cut from this
-- build (founder call: not worth a new unauthenticated write for 2-5
-- partners answerable by hand). Column stays so it's ready when wanted.

alter table leads
  add column if not exists attribution_source text
    check (attribution_source in ('contractor_partner', 'friend_family', 'search', 'social', 'other')),
  add column if not exists attribution_partner_slug text,
  add column if not exists attribution_captured_at timestamptz,
  add column if not exists attribution_first_touch_at timestamptz;

alter table claims
  add column if not exists attribution_source text
    check (attribution_source in ('contractor_partner', 'friend_family', 'search', 'social', 'other')),
  add column if not exists attribution_partner_slug text;

NOTIFY pgrst, 'reload schema';
