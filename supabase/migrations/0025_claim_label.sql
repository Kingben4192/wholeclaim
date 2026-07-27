-- Decision #75 -- claim identification field. Required going forward at
-- claim creation (enforced in ClaimWizard.tsx + createClaim()), but the
-- column itself stays nullable with no backfill -- same precedent as
-- claim_category (0019), signup_category (0021), date_discovered (0015):
-- existing rows get NULL and the display layer supplies a fallback, no
-- write-side migration of old data. Confirmed via full-repo audit
-- (2026-07-27) that no address or other identifying field exists anywhere
-- else in the schema (profiles, leads, onboarding fields) to backfill from
-- even if we wanted to.

alter table claims
  add column if not exists label text;

NOTIFY pgrst, 'reload schema';
