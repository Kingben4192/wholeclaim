-- WholeClaim M2 schema: library_entries (Knowledge Library), ai_runs (audit log),
-- ai_ip_calls (per-IP rate-limit counter).

create table if not exists library_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  type text not null check (type in ('statute', 'code', 'price', 'procedure')),
  jurisdiction text not null,
  cite text not null,
  summary text not null,
  verified_date date,
  active boolean not null default true,
  source_url text,
  created_at timestamptz not null default now()
);

-- ai_runs is the audit log for every AI call: prompt version, model, token
-- counts, and output, keyed to the user and (optionally) the claim.
create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid references claims (id) on delete set null,
  tool text not null,
  prompt_version text not null,
  output text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now()
);

-- Shared per-IP counter for AI-route rate limiting (cost-attack protection).
-- No user_id — the whole point is to catch abuse across accounts sharing an IP.
create table if not exists ai_ip_calls (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

alter table library_entries enable row level security;
alter table ai_runs enable row level security;
alter table ai_ip_calls enable row level security;

-- Global curated entries (owner_id null) are readable by everyone authenticated;
-- writable only by an admin acting outside RLS (service role / SQL editor) —
-- the insert check below means no authenticated user can write owner_id = null.
create policy "library_entries: read own or global" on library_entries
  for select to authenticated using (owner_id = auth.uid() or owner_id is null);
create policy "library_entries: owner insert" on library_entries
  for insert to authenticated with check (owner_id = auth.uid());
create policy "library_entries: owner update" on library_entries
  for update to authenticated using (owner_id = auth.uid());
create policy "library_entries: owner delete" on library_entries
  for delete to authenticated using (owner_id = auth.uid());

create policy "ai_runs: owner all" on ai_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_ip_calls: authenticated insert" on ai_ip_calls
  for insert to authenticated with check (true);
create policy "ai_ip_calls: authenticated read" on ai_ip_calls
  for select to authenticated using (true);
