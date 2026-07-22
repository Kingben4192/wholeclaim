-- Documentation Score v2: additive checklist-category tag for evidence_items.
-- Today evidence_items.label is free text with no way to tell a
-- photo-coverage checklist item apart from a document checklist item
-- deterministically. This column lets the new scoring engine (Decision
-- Log #40) split Evidence Coverage from Documentation Completeness.
--
-- Nullable, no default: every existing row gets category = NULL and is
-- simply excluded from the new engine's category scoring until tagged.
-- No backfill, no data rewritten, no other table touched. Full
-- non-destructiveness verification is in
-- docs/confidential/Documentation-Score-Schema-and-Checklist-Plan-DRAFT.md
-- (gitignored, not in this repo's tracked history).
--
-- Reviewed and approved 2026-07-21. NOT yet run against production —
-- pasted into the Supabase SQL Editor only after separate explicit go-ahead,
-- per supabase/migrations/README.md's manual, human-run process.

alter table evidence_items
  add column if not exists category text
  check (category in ('evidence_coverage', 'documentation_completeness'));

-- Required by supabase/migrations/README.md — PostgREST's schema cache has
-- caused three separate real incidents (0007, 0008, 0013) where new
-- columns/tables/policies weren't visible until this ran. Always the last
-- statement, same paste-and-execute action as the migration itself.
NOTIFY pgrst, 'reload schema';
