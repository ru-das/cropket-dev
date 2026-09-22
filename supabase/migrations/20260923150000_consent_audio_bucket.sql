-- Private bucket for the farmer's spoken deal consent (SPEC.md §4.13, §5.1
-- VoiceConsent, §9.2 Phase 3 "3.6"). Layout and policies copy
-- `20260917021207_crop_photos_bucket.sql` exactly - `{auth.uid()}/{blobId}.webm`
-- is the RLS check, same "the folder is the permission" shape. No buyer or
-- admin policy here: the buyer never hears the clip, and dispute/admin
-- access (if it's ever needed) goes through the service role, later.
insert into storage.buckets (id, name, public)
values ('consent-audio', 'consent-audio', false)
on conflict (id) do nothing;

create policy consent_audio_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'consent-audio'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );

create policy consent_audio_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'consent-audio'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );

-- uploadConsentAudio() uses `upsert: true` (a retry after a half-failed
-- upload re-sends the same path) - Supabase Storage does that as an UPDATE
-- when the object already exists, same reasoning as crop-photos' policy.
create policy consent_audio_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'consent-audio'
    and (storage.foldername(name))[1] = auth.uid ()::text
  )
  with check (
    bucket_id = 'consent-audio'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );
