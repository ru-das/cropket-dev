-- Tests for mandi_heat_inputs() (SPEC.md §2.4, 2.3's `agmarknet_link`
-- migration). This function only gathers the three numbers heat.ts needs -
-- the ratio math and colour thresholds are tested in app/tests/unit/domain/
-- heat.test.ts, not here (CLAUDE.md §3: pure calculations live in
-- `_shared/domain/`, SQL only aggregates). Self-contained fixture rows, own
-- ids, a fixed test date - never depends on seed.sql or the real clock.
-- Everything here rolls back.
begin;
select plan(5);

insert into mandis (id, name, location) values
  ('99999999-9999-9999-9999-999999999991', 'Test Mandi A', 'SRID=4326;POINT(74.0 20.0)');

-- 30 days of trailing history, arrivals fixed at 100 t/day, so the 30-day
-- average is exactly 100 - easy to assert on.
insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
select
  '99999999-9999-9999-9999-999999999991',
  'onion',
  '2020-01-01'::date - n,
  150000, 200000, 180000,
  100,
  'seed'
from generate_series(1, 30) as n;

-- today: real arrivals, 150 t - the ratio 150/100 = 1.5 would be "red".
insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
values ('99999999-9999-9999-9999-999999999991', 'onion', '2020-01-01', 160000, 210000, 190000, 150, 'agmarknet');

-- a second crop at the same mandi/date with arrivals unknown (the
-- data.gov.in-only case, no matching Agmarknet arrivals row) - must not
-- appear in the output at all, never with a made-up arrivals number.
insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
values ('99999999-9999-9999-9999-999999999991', 'tomato', '2020-01-01', 80000, 120000, 100000, null, 'agmarknet');

insert into auth.users (id, phone) values ('88888888-8888-8888-8888-888888888881', '0000000099');
insert into profiles (id, name, role, phone) values
  ('88888888-8888-8888-8888-888888888881', 'Test Farmer', 'farmer', '0000000099');

-- a lot ~10 km from the mandi, created on the test date - counted.
insert into lots (id, farmer_id, crop, quantity_kg, qr_code, location, created_at) values
  ('77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888881',
   'onion', 2000, 'L-000001', 'SRID=4326;POINT(74.0 20.09)', '2020-01-01 06:00:00+05:30');

-- a lot ~60 km from the mandi, same day and crop - outside the 50 km
-- radius, must not be counted.
insert into lots (id, farmer_id, crop, quantity_kg, qr_code, location, created_at) values
  ('77777777-7777-7777-7777-777777777772', '88888888-8888-8888-8888-888888888881',
   'onion', 5000, 'L-000002', 'SRID=4326;POINT(74.0 20.54)', '2020-01-01 06:00:00+05:30');

select is(
  (select avg_arrivals_30d from mandi_heat_inputs('2020-01-01') where crop = 'onion'),
  100::numeric,
  'the 30-day average is exactly 100 (30 days seeded at 100 t/day)'
);

select is(
  (select arrivals_tonnes from mandi_heat_inputs('2020-01-01') where crop = 'onion'),
  150::numeric,
  'today''s arrivals_tonnes is the real value just inserted'
);

select is(
  (select nearby_lot_tonnes from mandi_heat_inputs('2020-01-01') where crop = 'onion'),
  2::numeric,
  'only the lot within 50 km counts (2 t) - the 60 km lot (5 t) is excluded'
);

select is(
  (select count(*)::int from mandi_heat_inputs('2020-01-01') where crop = 'tomato'),
  0,
  'a mandi/crop with unknown arrivals today is left out entirely, never guessed'
);

set local role authenticated;
select throws_ok(
  $$ select * from mandi_heat_inputs('2020-01-01') $$,
  null, null,
  'an authenticated client cannot call mandi_heat_inputs directly'
);

select * from finish(true);
rollback;
