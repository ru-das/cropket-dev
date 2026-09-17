-- Plain lat/lng for `mandis` and `profiles` (SPEC.md §9.2 Phase 2 "2.4 Prices
-- screen"). PostgREST serves a `geography(point,4326)` column as hex EWKB
-- (e.g. "0101000020E610..."), which MapLibre/JS cannot read directly. A
-- generated column is the smallest fix: no view, no client-side decoder, and
-- it can never drift from `location` because Postgres recomputes it from
-- `location` on every write.
--
-- Both tables already `grant select ... to authenticated` at the table level
-- (20260916164928_profiles.sql, 20260917113709_market_data.sql), which
-- covers new columns automatically - no RLS or grant change needed here.
-- Generated columns are computed, never client-writable.

alter table mandis
  add column lat double precision generated always as (st_y (location::geometry)) stored,
  add column lng double precision generated always as (st_x (location::geometry)) stored;

-- Nullable on profiles: a farmer can skip the GPS step at onboarding
-- (SPEC.md §4.3, ProfileInput's `location` is nullable) - the prices
-- screen's "nearest mandi" pick falls back to "best price" when this is null.
alter table profiles
  add column lat double precision generated always as (st_y (location::geometry)) stored,
  add column lng double precision generated always as (st_x (location::geometry)) stored;
