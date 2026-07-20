-- Loss-of-Use Tracker (Roadmap Phase 1, Pro): hotels, meals, laundry,
-- storage, mileage, pet boarding, other reimbursable expenses incurred
-- while the home is uninhabitable. Deterministic summary only (Decision
-- #9) — no AI call in the tracker itself.

create table if not exists loss_of_use_expenses (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  category text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  description text,
  created_at timestamptz not null default now()
);

alter table loss_of_use_expenses enable row level security;

create policy "loss_of_use_expenses: owner all" on loss_of_use_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
