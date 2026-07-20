-- WholeClaim M4: public grader leads + grader-first onboarding (Decision #29).

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  us_state text,
  grade text not null,
  score integer not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  account_created_at timestamptz,
  claim_prefilled_at timestamptz,
  claim_id uuid references claims (id) on delete set null
);

create index if not exists leads_email_idx on leads (lower(email));

alter table leads enable row level security;

-- Public grader submits before any account exists.
create policy "leads: anon insert" on leads
  for insert to anon with check (true);

-- A freshly authenticated user can read back their own lead (by email) once
-- signed in, to prefill their claim. No one else's leads are readable this
-- way; broader lead access (marketing, admin) stays service-role only.
create policy "leads: owner read by email" on leads
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "leads: owner update by email" on leads
  for update to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Grader result carried onto the claim it seeded (Decision #29, Brief §12.4).
alter table claims
  add column if not exists baseline_grade text;
