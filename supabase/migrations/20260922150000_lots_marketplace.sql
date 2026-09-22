-- Buyer marketplace reads (SPEC.md §4.10, §9.2 Phase 3 "3.2"). Three things:
--
-- 1. lat/lng generated columns on `lots`, same fix mandis/profiles already
--    got in 20260917133249_mandi_latlng.sql - PostgREST serves
--    geography(point,4326) as hex EWKB that JS can't read. The table-level
--    `grant select on lots to authenticated` (1.6's migration) already
--    covers these new columns, so no grant change is needed here.
--
-- 2. A buyer-facing select policy on `lots`, scoped to `status = 'listed'`
--    only - a draft never leaves its farmer's screen. `lots` carries no
--    phone number, so this needs no column list to keep "buyer queries
--    never return the farmer's phone" (AGENTS.md §4) true.
--
-- 3. Buyers can now see a listed lot's real scan photo. Until this change,
--    `grade_results` and the `crop-photos` bucket were both strictly
--    farmer-own (the bucket migration's comment said "buyers never get a
--    policy here - only the uploading farmer can"). Both gain a narrow
--    extra select policy: readable only through a lot that is actually
--    `listed`. A draft's photos stay exactly as private as before.
alter table lots
  add column lat double precision generated always as (st_y (location::geometry)) stored,
  add column lng double precision generated always as (st_x (location::geometry)) stored;

create index lots_status_created_idx on lots (status, created_at desc);

create policy lots_select_listed on lots
  for select to authenticated
  using (status = 'listed');

create policy grade_results_select_listed on grade_results
  for select to authenticated
  using (
    exists (
      select 1 from lots l
      where l.grade_result_id = grade_results.id and l.status = 'listed'
    )
  );

create policy crop_photos_select_listed on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crop-photos'
    and exists (
      select 1 from grade_results g
      join lots l on l.grade_result_id = g.id
      where l.status = 'listed' and storage.objects.name = any (g.photo_paths)
    )
  );
