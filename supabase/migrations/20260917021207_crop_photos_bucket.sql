-- Private bucket for crop scan photos (SPEC.md §5.1 SmartFrameCamera, §7.4).
-- Layout is `{auth.uid()}/{blobId}.jpg` - the folder is the RLS check, same
-- pattern as profiles (each row/object only visible to the user who owns it).
-- 1.3 (grade Edge Function) reads these with a signed URL via the service
-- role, so buyers never get a policy here - only the uploading farmer can.
insert into storage.buckets (id, name, public)
values ('crop-photos', 'crop-photos', false)
on conflict (id) do nothing;

create policy crop_photos_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crop-photos'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );

create policy crop_photos_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crop-photos'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );

-- A retry after a half-failed upload re-sends the same blob id with
-- `upsert: true`. Supabase Storage does that as an UPDATE when the object
-- already exists, so this policy is required too, not just insert/select.
create policy crop_photos_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crop-photos'
    and (storage.foldername(name))[1] = auth.uid ()::text
  )
  with check (
    bucket_id = 'crop-photos'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );

create policy crop_photos_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crop-photos'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );
