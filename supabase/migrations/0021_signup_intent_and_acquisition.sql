-- Signup Category + Acquisition Source Tracking -- instrumentation only
-- (see 00_Founder/Decisions.md #45). Four additive, nullable columns on
-- profiles, no backfill -- existing rows stay NULL and are simply excluded,
-- same precedent as claims.claim_category in 0019.
--
-- signup_category reuses the exact same 5-value taxonomy as
-- claims.claim_category (src/lib/claimCategories.ts) -- deliberately not a
-- second, independent list. referral_source is a separate, new fixed
-- taxonomy (src/lib/acquisitionSource.ts) describing acquisition channel,
-- not dispute type.

alter table profiles
  add column if not exists signup_category text
    check (signup_category in (
      'Insurance Claim',
      'Water / Utility Dispute',
      'Contractor Dispute',
      'Property Damage',
      'Other'
    )),
  add column if not exists referral_source text
    check (referral_source in (
      'Google',
      'Social media',
      'Direct visit',
      'Contractor referral',
      'Personal referral',
      'Other'
    )),
  add column if not exists acquisition_campaign text,
  add column if not exists landing_path text;

NOTIFY pgrst, 'reload schema';
