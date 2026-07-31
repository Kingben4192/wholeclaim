-- Decision #88 / 04_Engineering/STORAGE_ENFORCEMENT_BRIEF.md, steps 1-2.
-- Until now only the file-COUNT cap (25/claim) was enforced -- no byte-sum
-- tracking existed anywhere (uploadLimits.ts's own comment said so
-- directly). size_bytes is backfilled from Storage's own object metadata
-- (storage.objects.metadata->>'size'), never trusted from upload-time
-- application data for historical rows -- the same "don't trust
-- client-reported size" principle the brief requires going forward,
-- applied retroactively to existing rows too.

alter table files
  add column if not exists size_bytes bigint;

update files f
set size_bytes = (o.metadata->>'size')::bigint
from storage.objects o
where o.bucket_id = 'evidence'
  and o.name = f.storage_path
  and f.size_bytes is null;

-- Running totals, maintained transactionally by application code on
-- upload and on hard purge only -- a soft delete frees a file-count slot
-- (Decision #52) but not bytes; freeing bytes on soft delete would
-- silently under-count usage. Backfilled here from the now-populated
-- size_bytes column so existing accounts don't start at zero.
-- size_bytes stays nullable: a handful of pre-existing rows may have no
-- matching storage.objects entry (renamed/removed outside the app) and
-- coalesce() below treats those as 0 rather than failing the backfill.

alter table claims
  add column if not exists storage_used_bytes bigint not null default 0;

alter table profiles
  add column if not exists storage_used_bytes bigint not null default 0;

update claims c
set storage_used_bytes = coalesce((
  select sum(f.size_bytes) from files f where f.claim_id = c.id
), 0);

update profiles p
set storage_used_bytes = coalesce((
  select sum(f.size_bytes) from files f where f.user_id = p.id
), 0);

-- Atomic increment for both running totals in one call, used on upload
-- (positive delta) and on hard purge (negative delta) -- src/app/claim/
-- actions.ts. Deliberately NOT security definer: runs as the calling
-- (authenticated) role, so the existing owner-scoped RLS policies on
-- claims ("claims: owner all") and profiles ("profiles: owner update")
-- still apply to the UPDATEs inside it -- a user can only move their own
-- rows, same as every other write path in this schema.
create or replace function increment_storage_usage(
  p_claim_id uuid,
  p_user_id uuid,
  p_delta_bytes bigint
) returns void
language sql
set search_path = public
as $$
  update claims set storage_used_bytes = storage_used_bytes + p_delta_bytes where id = p_claim_id;
  update profiles set storage_used_bytes = storage_used_bytes + p_delta_bytes where id = p_user_id;
$$;

grant execute on function increment_storage_usage(uuid, uuid, bigint) to authenticated;

NOTIFY pgrst, 'reload schema';
