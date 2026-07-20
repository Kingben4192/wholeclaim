-- Billing entitlement schema foundation (Decision Log #31, #32 — Step 1 of
-- the approved Billing Build Order). Schema only: no app code changes, no
-- Stripe calls, no RLS rules that gate any OTHER table on entitlement
-- status. profiles.plan is left untouched as a derived/cached convenience
-- field per the founder's explicit instruction; these new tables become
-- the source of truth for entitlement resolution once the
-- isPro(claim_id, user_id) resolver is built in a later step.

-- ---------------------------------------------------------------------
-- claims: soft-delete support (Decision #31). Nullable, no default —
-- existing rows are unaffected by this addition; deleted_at = null means
-- "not deleted," which is already the correct state for every existing
-- row without needing an explicit default. Nothing writes to this column
-- yet — no app code changes are part of this migration.
-- ---------------------------------------------------------------------

alter table claims add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------
-- claim_entitlements: claim-level Pro access. One row per grant. A
-- refunded/revoked entitlement is never deleted (Decision #31 — history
-- must be preserved so a refunded claim can't be silently repurchased as
-- a fresh free claim); its status flips to 'revoked' instead.
-- entitlement_type is left as free text, not a CHECK-constrained enum, so
-- future entitlement types can be added without a migration rewrite. The
-- only type in use as of this migration is 'lifetime_claim_unlock' (the
-- $49 path) — nothing writes this yet.
-- ---------------------------------------------------------------------

create table if not exists claim_entitlements (
  id uuid primary key default gen_random_uuid(),
  -- Nullable + ON DELETE SET NULL, not CASCADE: billing history must
  -- survive even if a claims row were ever hard-deleted. The normal path
  -- is claims.deleted_at (soft delete) and never touches this row at all;
  -- this FK behavior is only a safety net for a hard delete, not the
  -- primary mechanism (Decision #31).
  claim_id uuid references claims (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement_type text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  stripe_payment_id text,
  stripe_customer_id text,
  purchased_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency: a redelivered checkout.session.completed webhook for the
-- same payment must not create a second entitlement row. Partial index
-- (where stripe_payment_id is not null) so multiple NULLs are still
-- allowed for any future entitlement type that isn't payment-backed.
create unique index if not exists claim_entitlements_stripe_payment_id_key
  on claim_entitlements (stripe_payment_id)
  where stripe_payment_id is not null;

create index if not exists claim_entitlements_claim_id_idx
  on claim_entitlements (claim_id);
create index if not exists claim_entitlements_user_id_idx
  on claim_entitlements (user_id);

alter table claim_entitlements enable row level security;

-- Read-only for the owning user. These rows are written exclusively by
-- the service-role webhook handler (bypasses RLS) once webhook handling
-- is built in a later step — never by the client directly. No
-- insert/update/delete policy exists for anon/authenticated on purpose.
create policy "claim_entitlements: owner read" on claim_entitlements
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- profiles: additive columns only. stripe_customer_id already exists
-- (0001_init.sql) — not re-added here. plan is intentionally left as-is:
-- kept as a derived/cached convenience field per the founder's decision,
-- not redesigned or removed in this migration.
-- ---------------------------------------------------------------------

alter table profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  add column if not exists subscription_current_period_end timestamptz;

-- ---------------------------------------------------------------------
-- claim_guarantee: Success Guarantee tracking only — refund logic is
-- explicitly deferred to a later step, this just gives it somewhere to
-- write. purchase_type mirrors claim_entitlements.entitlement_type in
-- staying unconstrained text for the same forward-compatibility reason.
-- current_status is likewise left unconstrained rather than encoding a
-- state machine that hasn't been designed yet. One tracking row per claim.
-- ---------------------------------------------------------------------

create table if not exists claim_guarantee (
  id uuid primary key default gen_random_uuid(),
  -- Same reasoning as claim_entitlements.claim_id above — nullable +
  -- SET NULL, never CASCADE, so a guarantee/refund record can't be
  -- erased by a claims deletion (Decision #31).
  claim_id uuid references claims (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  purchase_type text not null,
  initial_grade text,
  initial_score integer,
  current_status text not null default 'active',
  eligible_for_refund boolean not null default false,
  completed_at timestamptz,
  refund_requested_at timestamptz,
  refund_processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists claim_guarantee_claim_id_key
  on claim_guarantee (claim_id);
create index if not exists claim_guarantee_user_id_idx
  on claim_guarantee (user_id);

alter table claim_guarantee enable row level security;

create policy "claim_guarantee: owner read" on claim_guarantee
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- processed_stripe_events: webhook idempotency ledger. Not wired up yet
-- (webhook handling is a later step) — this just reserves the table. No
-- user_id column — this is an internal log, not user-facing data. RLS is
-- enabled with zero policies, so only the service-role client (which
-- bypasses RLS entirely) can ever read or write it; anon/authenticated
-- get no access at all.
-- ---------------------------------------------------------------------

create table if not exists processed_stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table processed_stripe_events enable row level security;

-- ---------------------------------------------------------------------
-- updated_at trigger, shared by the two tables above that track state
-- transitions over time (claim_entitlements.status flipping to 'revoked';
-- claim_guarantee's completion/refund fields).
-- ---------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger claim_entitlements_set_updated_at
  before update on claim_entitlements
  for each row execute function set_updated_at();

create trigger claim_guarantee_set_updated_at
  before update on claim_guarantee
  for each row execute function set_updated_at();
