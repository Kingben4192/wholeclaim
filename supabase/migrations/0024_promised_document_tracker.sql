-- Promised-Document Tracker (founder audit, 2026-07-26) -- tracks a
-- carrier-side commitment ("they said the denial letter was coming") as
-- distinct from evidence_items (our own checklist of what we think we
-- need). Does not affect Documentation Score scoring -- no changes to
-- evidence_items, checklistTemplates, or documentationScore.ts.

create table if not exists promised_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  promised_by text,
  promised_date date not null default current_date,
  target_date date,
  file_id uuid references files (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table promised_items enable row level security;

create policy "promised_items: owner all" on promised_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
