-- Close the remaining claim-ownership write gap (Decision #76) on the two
-- tables 0016 did not alter, and stop a signed-in user from lowering their
-- own storage counter below the bytes their files actually occupy.
--
-- promised_items and ai_runs already have RLS and an owner check
-- (auth.uid() = user_id). They did not require the referenced claim_id to
-- belong to that same user, so a direct API call could attach a row to
-- someone else's claim while stamping the caller's own user_id.
-- ai_runs.claim_id is nullable (Knowledge Library ingestion); a null
-- claim stays allowed.

alter policy "promised_items: owner all" on promised_items
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

alter policy "ai_runs: owner all" on ai_runs
  with check (
    auth.uid() = user_id
    and (
      claim_id is null
      or exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
    )
  );

-- increment_storage_usage is granted to authenticated and previously
-- applied any delta the caller supplied to their own rows. A direct RPC
-- with a negative delta could drop storage_used_bytes below the real file
-- sum and bypass the byte cap. The new floor is the sum of files.size_bytes
-- the caller still owns. The app's own upload (+) and hard-delete (-)
-- paths still land on the real total, because they change the files row
-- and the counter by the same number of bytes.

create or replace function increment_storage_usage(
  p_claim_id uuid,
  p_user_id uuid,
  p_delta_bytes bigint
) returns void
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not allowed';
  end if;

  if not exists (
    select 1 from claims c
    where c.id = p_claim_id and c.user_id = auth.uid()
  ) then
    raise exception 'not allowed';
  end if;

  update claims
  set storage_used_bytes = greatest(
    storage_used_bytes + p_delta_bytes,
    coalesce((select sum(size_bytes) from files where claim_id = p_claim_id), 0)
  )
  where id = p_claim_id and user_id = auth.uid();

  update profiles
  set storage_used_bytes = greatest(
    storage_used_bytes + p_delta_bytes,
    coalesce((select sum(size_bytes) from files where user_id = auth.uid()), 0)
  )
  where id = auth.uid();
end;
$$;

NOTIFY pgrst, 'reload schema';
