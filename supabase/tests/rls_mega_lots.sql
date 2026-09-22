-- RLS for `mega_lots` and `mega_lot_items` (SPEC.md §5.6, §9.2 Phase 3
-- "3.4"). The "every table has RLS on" CI guard already lives in
-- rls_profiles.sql and covers these two tables too, so this file only
-- checks grants, select scoping, and the sibling bids_select_mega_listed
-- policy the same migration added (group_mega_lots.sql covers the actual
-- grouping rules). Everything here rolls back.
begin;
select plan(10);

insert into auth.users (id, phone) values
  ('a0000001-0000-0000-0000-000000000001', '0000000031'),
  ('a0000002-0000-0000-0000-000000000002', '0000000032'),
  ('a0000003-0000-0000-0000-000000000003', '0000000033');

insert into profiles (id, name, role, phone, kyc_status) values
  ('a0000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000031', 'pending'),
  ('a0000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000032', 'verified'),
  ('a0000003-0000-0000-0000-000000000003', 'Patil Agro', 'buyer', '0000000033', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
   'onion', 300, 'A', 'L-TESTMEGA1', 'in_mega'),
  ('b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   'onion', 300, 'A', 'L-TESTMEGA2', 'in_mega');

insert into mega_lots (id, crop, grade, total_kg, location, status) values
  ('c0000001-0000-0000-0000-000000000001', 'onion', 'A', 600, 'SRID=4326;POINT(73.79 20.0)', 'listed'),
  ('c0000002-0000-0000-0000-000000000002', 'onion', 'A', 600, 'SRID=4326;POINT(73.79 20.0)', 'sold');

insert into mega_lot_items (mega_lot_id, lot_id, farmer_id, quantity_kg) values
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001', 300),
  ('c0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000001', 300);

-- A bid on each mega lot, inserted directly as owner (bypasses RLS) so
-- select scoping can be checked without depending on place_bid.
insert into bids (id, mega_lot_id, buyer_id, price_per_quintal_paise) values
  ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'a0000003-0000-0000-0000-000000000003', 175000),
  ('d0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002',
   'a0000003-0000-0000-0000-000000000003', 175000);

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000002-0000-0000-0000-000000000002","phone":"0000000032","role":"authenticated"}';

-- 1. no insert grant on mega_lots - only group_mega_lots() (security definer) writes it
select throws_ok(
  $$ insert into mega_lots (crop, grade, total_kg, location)
     values ('onion', 'A', 600, 'SRID=4326;POINT(73.79 20.0)') $$,
  null, null,
  'a client cannot insert into mega_lots directly - no grant'
);

-- 2. no update grant
select throws_ok(
  $$ update mega_lots set status = 'sold' where id = 'c0000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot update a mega_lot - no grant'
);

-- 3. no delete grant
select throws_ok(
  $$ delete from mega_lots where id = 'c0000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot delete a mega_lot - no grant'
);

-- 4. no insert grant on mega_lot_items either
select throws_ok(
  $$ insert into mega_lot_items (mega_lot_id, lot_id, farmer_id, quantity_kg)
     values ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
             'a0000001-0000-0000-0000-000000000001', 300) $$,
  null, null,
  'a client cannot insert into mega_lot_items directly - no grant'
);

-- 5. a buyer sees a listed mega lot
select is(
  (select count(*)::int from mega_lots where id = 'c0000001-0000-0000-0000-000000000001'),
  1,
  'a buyer sees a listed mega lot'
);

-- 6. a buyer sees that mega lot's membership
select is(
  (select count(*)::int from mega_lot_items where mega_lot_id = 'c0000001-0000-0000-0000-000000000001'),
  1,
  'a buyer sees the membership of a listed mega lot'
);

-- 7. a buyer who isn't a member sees nothing for a sold mega lot
select is(
  (select count(*)::int from mega_lot_items where mega_lot_id = 'c0000002-0000-0000-0000-000000000002'),
  0,
  'a non-member buyer sees no items on a mega lot that is no longer listed'
);

-- 8. a buyer sees a bid on a listed mega lot (bids_select_mega_listed), even placed by another buyer
select is(
  (select count(*)::int from bids where mega_lot_id = 'c0000001-0000-0000-0000-000000000001'),
  1,
  'a buyer sees bids on a listed mega lot'
);

-- 9. a buyer sees no bids on a mega lot that is no longer listed
select is(
  (select count(*)::int from bids where mega_lot_id = 'c0000002-0000-0000-0000-000000000002'),
  0,
  'a buyer sees no bids on a mega lot that is no longer listed'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000001-0000-0000-0000-000000000001","phone":"0000000031","role":"authenticated"}';

-- 10. the member farmer still sees their own item row after the mega lot sells
select is(
  (select count(*)::int from mega_lot_items where mega_lot_id = 'c0000002-0000-0000-0000-000000000002'),
  1,
  'the member farmer still sees their own item on a mega lot that sold'
);

select * from finish(true);
rollback;
