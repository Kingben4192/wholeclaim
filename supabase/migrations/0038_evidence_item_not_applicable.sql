-- "Not applicable" for built-in checklist items (Decision #134, Option A).
-- Display only: the item is greyed out and can be hidden, and the user can
-- reverse it at any time. The Documentation Score and Success Guarantee
-- eligibility are unchanged -- the scoring engine does not read this
-- column, so a not-applicable item still counts exactly as before.
--
-- Additive with a default: existing rows read false, and code deployed
-- before this migration simply never shows the option as set.

alter table public.evidence_items
  add column if not exists not_applicable boolean not null default false;

NOTIFY pgrst, 'reload schema';
