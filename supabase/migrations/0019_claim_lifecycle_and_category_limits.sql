-- Free-plan claim limits: per-category active-claim cap + lifecycle status
-- (Decision #44 -- see 00_Founder/Decisions.md). claim_category is a
-- DELIBERATELY SEPARATE axis from damage_category (loss-cause taxonomy,
-- claimTypeProfile.ts / checklistTemplateFor()) -- never reuse
-- damage_category, it is tightly coupled to Documentation Score checklist
-- seeding and a second independent mapping in claim/from-grade/route.ts;
-- colliding the two would silently degrade both.

alter table claims
  add column if not exists claim_category text
  check (claim_category in (
    'Insurance Claim', 'Water / Utility Dispute', 'Contractor Dispute',
    'Property Damage', 'Other'
  ));
-- Nullable, no default, no backfill -- same precedent as
-- evidence_items.category (0014), deleted_at and baseline_grade (0011):
-- every existing row gets claim_category = NULL and is excluded from the
-- new per-category gate entirely (NULL never matches a `.eq()` category
-- filter). CHECK constraint (unlike damage_category's historically
-- unconstrained free text) because this is explicitly a fixed enum
-- (founder brief) -- a typo'd/stray category value would otherwise
-- silently opt a claim out of the limit forever with no error, which a
-- limit-enforcement column can't tolerate given every other gate in this
-- codebase fails closed.
-- IMPORTANT: this value list must be kept in exact sync by hand with
-- CLAIM_CATEGORIES in src/lib/claimCategories.ts -- Postgres cannot import
-- the TS source of truth. Changing the category list later requires a
-- follow-up migration to alter this constraint, not a config-only change.

alter table claims
  add column if not exists status text
  not null default 'active'
  check (status in ('active', 'resolved', 'archived', 'closed'));
-- not null default 'active': correct for every existing row (they ARE
-- currently open/live claims) -- but behaviorally inert for those rows
-- regardless of value, since claim_category is NULL for all of them and
-- the gate always filters on claim_category first. Must be kept in sync
-- with CLAIM_STATUSES in src/lib/claimCategories.ts.

create index if not exists claims_user_category_status_idx
  on claims (user_id, claim_category, status)
  where deleted_at is null;
-- Supports both gate queries (active-only lookup and full-history lookup
-- for the anti-abuse check). Partial on deleted_at is null to match the
-- one other precedent that filters it (pricing/page.tsx) even though
-- nothing writes deleted_at today -- free, forward-compatible.

-- No RLS changes: existing "claims: owner all" policy already covers
-- every read/write path these two columns need.

NOTIFY pgrst, 'reload schema';
