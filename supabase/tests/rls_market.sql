-- RLS for the six market reference tables (SPEC.md §5.6, §9.2 Phase 2
-- "2.1"). Unlike `profiles`/`lots`, these tables aren't per-user - every
-- signed-in user reads the same rows, so there is nothing to test for
-- select *isolation*, only that select works for any authenticated user
-- and that no client can write. The "every table in public has RLS on"
-- guard already lives in rls_profiles.sql and covers these tables too, so
-- it isn't repeated here. Self-contained (own fixture rows, not the
-- committed `supabase/seed.sql` data) so this test passes whether or not
-- the seed has been run. Everything here rolls back.
begin;
select plan(14);

-- fixture rows, inserted as the table owner - the same way seed.sql and
-- cron-fetch-prices (2.3, service role) write these tables. Never as
-- `authenticated`.
insert into mandis (id, name, location) values
  ('99999999-9999-9999-9999-999999999999', 'Test Mandi', 'SRID=4326;POINT(74.0 20.0)');

insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
values ('99999999-9999-9999-9999-999999999999', 'onion', '2020-01-01', 176000, 220000, 200000, 50, 'seed');

insert into transporters (id, name, phone, rate_per_km_paise) values
  ('99999999-9999-9999-9999-999999999998', 'Test Transport', '7999999999', 2000);

set local role authenticated;

select lives_ok(
  $$ select 1 from crop_rules limit 1 $$,
  'an authenticated user can select crop_rules'
);
select lives_ok(
  $$ select 1 from mandis limit 1 $$,
  'an authenticated user can select mandis'
);
select lives_ok(
  $$ select 1 from mandi_prices limit 1 $$,
  'an authenticated user can select mandi_prices'
);
select lives_ok(
  $$ select 1 from mandi_heat limit 1 $$,
  'an authenticated user can select mandi_heat'
);
select lives_ok(
  $$ select 1 from weather_daily limit 1 $$,
  'an authenticated user can select weather_daily'
);

select throws_ok(
  $$ insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
     values ('99999999-9999-9999-9999-999999999999', 'tomato', '2020-01-02', 100, 200, 150, 10, 'seed') $$,
  null, null,
  'an authenticated user cannot insert into mandi_prices'
);

select throws_ok(
  $$ update mandi_prices set modal_price_paise = 999999 where mandi_id = '99999999-9999-9999-9999-999999999999' $$,
  null, null,
  'an authenticated user cannot update mandi_prices'
);

select throws_ok(
  $$ delete from mandi_prices where mandi_id = '99999999-9999-9999-9999-999999999999' $$,
  null, null,
  'an authenticated user cannot delete from mandi_prices'
);

-- transporters: column-level grant only (SPEC.md §5.6 security rules) -
-- the driver's phone number must never reach the client.
select lives_ok(
  $$ select id, name, rate_per_km_paise from transporters limit 1 $$,
  'an authenticated user can select the public columns of transporters'
);

select throws_ok(
  $$ select phone from transporters limit 1 $$,
  null, null,
  'an authenticated user cannot select transporters.phone - no column grant'
);

reset role;

select throws_ok(
  $$ insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
     values ('99999999-9999-9999-9999-999999999999', 'onion', '2020-01-01', 100, 200, 150, 10, 'seed') $$,
  null, null,
  'a duplicate (mandi_id, crop, date) is rejected'
);

select throws_ok(
  $$ insert into mandi_heat (mandi_id, crop, date, ratio, colour)
     values ('99999999-9999-9999-9999-999999999999', 'onion', '2020-01-01', 1.0, 'purple') $$,
  null, null,
  'an unknown heat colour is rejected'
);

select throws_ok(
  $$ insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
     values ('99999999-9999-9999-9999-999999999999', 'potato', '2020-01-01', -100, 200, 150, 10, 'seed') $$,
  null, null,
  'a negative price is rejected'
);

select throws_ok(
  $$ insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
     values ('99999999-9999-9999-9999-999999999999', 'potato', '2020-01-02', 300, 200, 150, 10, 'seed') $$,
  null, null,
  'min_price_paise > modal_price_paise is rejected'
);

select * from finish(true);
rollback;
