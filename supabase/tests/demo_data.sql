-- Tests supabase/demo-data.sql (5.1). Two runs in the same transaction:
-- the first proves the known-good demo state comes out right; between the
-- two, a dev farmer's lot is (a) present before demo-data.sql ever runs
-- and (b) pulled into the demo mega lot as if group_mega_lots had grouped
-- it live during a practice run - the second run must release it back to
-- 'listed', not delete it, and must not leave the demo state doubled up.
begin;
select plan(14);

-- A dev-account farmer (9090910xxx range) with an already-listed lot, more
-- than 10 km from Niphad (so the first run's real group_mega_lots trigger
-- leaves it alone - not a group_mega_lots candidate) - this table must
-- survive a reset untouched, except when 05_02 below fabricates the
-- "already swept into a demo mega lot" scenario by hand.
insert into auth.users (id, phone) values ('88888888-8888-8888-8888-888888888801', '9090919999');
insert into profiles (id, name, role, phone, district) values
  ('88888888-8888-8888-8888-888888888801', 'Dev Farmer', 'farmer', '9090919999', 'Nashik');
insert into lots (id, farmer_id, crop, quantity_kg, grade, location, status, qr_code) values
  ('88888888-8888-8888-8888-888888888802', '88888888-8888-8888-8888-888888888801',
   'onion', 150, 'B', 'SRID=4326;POINT(75.0000 20.5000)', 'listed', 'L-DEVX01');

-- Demo people's auth.users rows - scripts/demo-reset.ts makes these
-- through the Admin API before calling demo-data.sql; this test makes them
-- directly since it has no Admin API to call.
insert into auth.users (id, phone)
select ('30000001-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       '909095' || lpad(n::text, 4, '0')
from generate_series(1, 18) n;

\ir ../demo-data.sql

select is((select count(*)::int from profiles where role = 'farmer' and phone like '90909500%'), 12,
  '12 demo farmers');
select is((select count(*)::int from profiles where role = 'buyer' and phone like '90909500%' and kyc_status = 'verified'), 3,
  '3 verified demo buyers');
select is((select count(*)::int from profiles where role = 'buyer' and phone like '90909500%' and kyc_status = 'pending'), 1,
  '1 unverified demo buyer');
select is((select count(*)::int from profiles where role = 'fpo' and phone like '90909500%'), 1, '1 demo fpo');
select is((select count(*)::int from profiles where role = 'admin' and phone like '90909500%'), 1, '1 demo admin');
select is((select count(*)::int from mega_lots where status = 'listed' and total_kg = 500), 1,
  'the four small onion lots formed one 500 kg mega lot');
select is(
  (select count(*)::int from mega_lot_items where mega_lot_id = (select id from mega_lots where total_kg = 500)),
  4, 'mega lot has exactly 4 member lots');
select is((select count(*)::int from bids where lot_id = '30000002-0000-0000-0000-000000000006'), 2,
  '2 seeded bids on the 1,200 kg lot');
select is((select count(*)::int from lots where farmer_id = '30000001-0000-0000-0000-000000000001'), 0,
  'demo farmer starts with zero lots');
select is((select status from lots where id = '88888888-8888-8888-8888-888888888802'), 'listed',
  'dev farmer''s own lot is untouched by the first run');

-- Simulate a practice run: the demo farmer creates+lists a leftover lot,
-- and the dev farmer's lot gets pulled into the demo mega lot (as if
-- group_mega_lots had grouped it live).
insert into lots (id, farmer_id, crop, quantity_kg, grade, location, status, qr_code) values
  ('88888888-8888-8888-8888-888888888803', '30000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'SRID=4326;POINT(74.1116 20.0847)', 'listed', 'L-PRACTICE');
insert into mega_lot_items (mega_lot_id, lot_id, farmer_id, quantity_kg)
  select id, '88888888-8888-8888-8888-888888888802', '88888888-8888-8888-8888-888888888801', 150
  from mega_lots where total_kg = 500;
update lots set status = 'in_mega' where id = '88888888-8888-8888-8888-888888888802';

\ir ../demo-data.sql

select is((select count(*)::int from lots where farmer_id = '30000001-0000-0000-0000-000000000001'), 0,
  'the leftover practice-run lot was wiped on the second run');
select is((select status from lots where id = '88888888-8888-8888-8888-888888888802'), 'listed',
  'dev farmer''s lot was released back to listed, not deleted');
select is((select count(*)::int from mega_lot_items where lot_id = '88888888-8888-8888-8888-888888888802'), 0,
  'dev farmer''s lot is no longer a mega lot member');
select is((select count(*)::int from mega_lots where total_kg = 500 and status = 'listed'), 1,
  'exactly one fresh 500 kg mega lot after the second run (not doubled up)');

select * from finish(true);
rollback;
