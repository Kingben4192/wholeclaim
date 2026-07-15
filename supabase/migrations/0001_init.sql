-- WholeClaim M1 schema: profiles, claims, entries, deadlines, evidence_items, files
-- RLS pattern: rows readable/writable only where user_id = auth.uid()

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  us_state text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  carrier text,
  claim_number text,
  policy_number text,
  date_of_loss date,
  damage_category text,
  damage_desc text,
  us_state text,
  offer_amount numeric,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('call', 'email', 'visit', 'photo', 'letter', 'payment', 'note')),
  contact text,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  file_id uuid,
  created_at timestamptz not null default now()
);

-- Schema only in M1; Storage wiring + FK to evidence_items lands in M5 (Evidence Vault).
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('photo', 'pdf', 'doc')),
  original_name text not null,
  uploaded_at timestamptz not null default now()
);

alter table evidence_items
  add constraint evidence_items_file_id_fkey
  foreign key (file_id) references files (id) on delete set null;

-- Row Level Security -----------------------------------------------------

alter table profiles enable row level security;
alter table claims enable row level security;
alter table entries enable row level security;
alter table deadlines enable row level security;
alter table evidence_items enable row level security;
alter table files enable row level security;

create policy "profiles: owner read" on profiles
  for select using (auth.uid() = id);
create policy "profiles: owner update" on profiles
  for update using (auth.uid() = id);
create policy "profiles: owner insert" on profiles
  for insert with check (auth.uid() = id);

create policy "claims: owner all" on claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entries: owner all" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "deadlines: owner all" on deadlines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "evidence_items: owner all" on evidence_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "files: owner all" on files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row on signup ------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
