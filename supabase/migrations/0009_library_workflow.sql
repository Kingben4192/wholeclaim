-- WholeClaim: Knowledge Library owner-approval workflow (Decision #10,
-- Invariant). The ingest prompt already generates confidence + verify_note
-- per draft (src/lib/anthropic/prompts.ts ingestPrompt), but there was
-- nowhere to store either, and no status to distinguish a draft awaiting
-- review from an approved, globally-curated entry.

alter table library_entries
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists confidence text check (confidence in ('high', 'medium', 'low')),
  add column if not exists verify_note text;

-- Any global entries that already existed before this column did were
-- manually curated by the founder outside this workflow — treat them as
-- already approved rather than silently hiding them from
-- buildLibraryContext's new status filter.
update library_entries
  set status = 'approved'
  where owner_id is null and status = 'pending';
