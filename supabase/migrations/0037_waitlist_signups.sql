-- Waitlist sign-ups for plans shown as "Coming soon" on /pricing
-- (Decision #133): WholeClaim Portfolio, Property Record+, Property Vault
-- and Contractor Pro. One row per email per plan; Portfolio also records
-- the number of units.
--
-- Written only by the server (src/app/pricing/actions.ts, service role).
-- Row-level security is on with no policies, so the anon and authenticated
-- roles can neither read nor write it -- unlike `leads`, there is no public
-- insert permission to maintain.

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null
    check (email = lower(email) and length(email) <= 254 and position('@' in email) > 1),
  plan text not null
    check (plan in ('portfolio', 'property_record_plus', 'property_vault', 'contractor_pro')),
  unit_count integer
    check (unit_count is null or unit_count between 1 and 100000),
  source_path text,
  created_at timestamptz not null default now(),
  constraint waitlist_signups_email_plan_key unique (email, plan),
  constraint waitlist_signups_units_for_portfolio
    check ((plan = 'portfolio') = (unit_count is not null))
);

alter table public.waitlist_signups enable row level security;
revoke all on public.waitlist_signups from anon, authenticated;

NOTIFY pgrst, 'reload schema';
