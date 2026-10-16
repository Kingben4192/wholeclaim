-- Billing and storage columns are server-only.
--
-- Plan, subscription and Stripe fields on profiles, and the storage
-- counters on profiles and claims, are written only by the server: the
-- Stripe webhook and server code using the service role. A guard trigger
-- rejects changes to them from the authenticated and anon roles. The
-- service role, the SQL editor (postgres) and SECURITY DEFINER functions
-- owned by postgres run as a different current_user and are unaffected.
--
-- Protected columns:
--   profiles: plan, stripe_customer_id, stripe_subscription_id,
--             subscription_status, subscription_current_period_end,
--             storage_used_bytes
--   claims:   storage_used_bytes
--
-- Applied to production right after the checkout change that writes
-- stripe_customer_id with the service role (374d952) was deployed.

-- 1. Guard trigger. Deliberately NOT security definer: current_user must be
--    the role that issued the statement for the check to mean anything.
create or replace function public.protect_billing_storage_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      if new.plan is distinct from 'free'
         or new.stripe_customer_id is not null
         or new.stripe_subscription_id is not null
         or new.subscription_status is not null
         or new.subscription_current_period_end is not null
         or new.storage_used_bytes is distinct from 0 then
        raise exception 'Billing and storage fields are managed by the server.'
          using errcode = '42501';
      end if;
    elsif new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status is distinct from old.subscription_status
       or new.subscription_current_period_end is distinct from old.subscription_current_period_end
       or new.storage_used_bytes is distinct from old.storage_used_bytes then
      raise exception 'Billing and storage fields are managed by the server.'
        using errcode = '42501';
    end if;

  elsif tg_table_name = 'claims' then
    if tg_op = 'INSERT' then
      if new.storage_used_bytes is distinct from 0 then
        raise exception 'Storage usage is managed by the server.'
          using errcode = '42501';
      end if;
    elsif new.storage_used_bytes is distinct from old.storage_used_bytes then
      raise exception 'Storage usage is managed by the server.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_billing_storage_columns() from public, anon, authenticated;

drop trigger if exists profiles_protect_billing_storage on public.profiles;
create trigger profiles_protect_billing_storage
  before insert or update on public.profiles
  for each row execute function public.protect_billing_storage_columns();

drop trigger if exists claims_protect_storage on public.claims;
create trigger claims_protect_storage
  before insert or update on public.claims
  for each row execute function public.protect_billing_storage_columns();

-- 2. The app's own storage counter. Upload and delete call this with the
--    user's session, so it must now run as its owner to get past the guard.
--    Body is unchanged from 0034 (caller must be p_user_id, must own the
--    claim, counter floored at the real file sum); only SECURITY DEFINER
--    and schema-qualified names are new.
create or replace function public.increment_storage_usage(
  p_claim_id uuid,
  p_user_id uuid,
  p_delta_bytes bigint
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    raise exception 'not allowed';
  end if;

  if not exists (
    select 1 from public.claims c
    where c.id = p_claim_id and c.user_id = auth.uid()
  ) then
    raise exception 'not allowed';
  end if;

  update public.claims
  set storage_used_bytes = greatest(
    storage_used_bytes + p_delta_bytes,
    coalesce((select sum(size_bytes) from public.files where claim_id = p_claim_id), 0)
  )
  where id = p_claim_id and user_id = auth.uid();

  update public.profiles
  set storage_used_bytes = greatest(
    storage_used_bytes + p_delta_bytes,
    coalesce((select sum(size_bytes) from public.files where user_id = auth.uid()), 0)
  )
  where id = auth.uid();
end;
$$;

revoke execute on function public.increment_storage_usage(uuid, uuid, bigint) from public, anon;
grant execute on function public.increment_storage_usage(uuid, uuid, bigint) to authenticated;

NOTIFY pgrst, 'reload schema';
