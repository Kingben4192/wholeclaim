-- WholeClaim M5: Evidence Vault storage wiring.
-- Files already have a table + RLS (0001_init.sql); this adds the actual
-- Storage bucket and matching object-level policies so uploads land
-- under a path only the owning user can read/write: {user_id}/{claim_id}/...

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "evidence bucket: owner select" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "evidence bucket: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "evidence bucket: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
