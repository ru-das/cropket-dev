-- Tests for group_mega_lots() (SPEC.md §5.3, §9.2 Phase 3 "3.4").
-- Verifies: same crop + grade + nearby unsold small lots combine once their
-- total reaches the 500 kg target; a different grade nearby is not swept; a
-- matching lot more than 10 km away is not swept; a lot that already has a
-- bid is excluded even if it would otherwise complete the group; a single
-- lot at or above the target never bundles; a lot cannot join two mega
-- lots. Everything here rolls back.
begin;
select plan(12);

insert into auth.users (id, phone) values
  ('e0000001-0000-0000-0000-000000000001', '0000000041'),
  ('e0000002-0000-0000-0000-000000000002', '0000000042');

insert into profiles (id, name, role, phone, kyc_status) values
  ('e0000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000041', 'pending'),
  ('e0000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000042', 'verified');

-- Four 150 kg onion Grade A lots at the same point (well inside 10 km).
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status, location) values
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001',
   'onion', 150, 'A', 'L-MEGA1', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000002-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000001',
   'onion', 150, 'A', 'L-MEGA2', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000003-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001',
   'onion', 150, 'A', 'L-MEGA3', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000004-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000001',
   'onion', 150, 'A', 'L-MEGA4', 'draft', 'SRID=4326;POINT(73.79 20.0)');

update lots set status = 'listed' where id = 'f0000001-0000-0000-0000-000000000001';

-- 1. no mega lot yet at 150 kg
select is(
  (select count(*)::int from mega_lots where crop = 'onion' and grade = 'A'),
  0,
  'no mega lot after the first small lot'
);

update lots set status = 'listed' where id = 'f0000002-0000-0000-0000-000000000002';

-- 2. still none at 300 kg
select is(
  (select count(*)::int from mega_lots where crop = 'onion' and grade = 'A'),
  0,
  'no mega lot at 300 kg'
);

update lots set status = 'listed' where id = 'f0000003-0000-0000-0000-000000000003';

-- 3. still none at 450 kg - below the 500 kg target
select is(
  (select count(*)::int from mega_lots where crop = 'onion' and grade = 'A'),
  0,
  'no mega lot at 450 kg, still below the 500 kg target'
);

update lots set status = 'listed' where id = 'f0000004-0000-0000-0000-000000000004';

-- 4. one mega lot created once the total reaches 500 kg
select is(
  (select count(*)::int from mega_lots where crop = 'onion' and grade = 'A'),
  1,
  'a mega lot is created once the total reaches the 500 kg target'
);

-- 5. total_kg is the sum of the grouped lots
select is(
  (select total_kg from mega_lots where crop = 'onion' and grade = 'A' limit 1),
  600,
  'total_kg is the sum of the four grouped lots'
);

-- 6. all four lots became members
select is(
  (select count(*)::int from mega_lot_items
   where mega_lot_id = (select id from mega_lots where crop = 'onion' and grade = 'A' limit 1)),
  4,
  'all four lots became mega_lot_items'
);

-- 7. all four member lots flipped to in_mega
select is(
  (select count(*)::int from lots
   where status = 'in_mega'
     and id in ('f0000001-0000-0000-0000-000000000001', 'f0000002-0000-0000-0000-000000000002',
                'f0000003-0000-0000-0000-000000000003', 'f0000004-0000-0000-0000-000000000004')),
  4,
  'all four member lots flipped to in_mega'
);

-- A Grade B lot at the same point: it can never join the onion-A group, and
-- (with no other Grade B lot around) forms no group of its own either.
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status, location) values
  ('f0000005-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000001',
   'onion', 150, 'B', 'L-MEGAB1', 'draft', 'SRID=4326;POINT(73.79 20.0)');
update lots set status = 'listed' where id = 'f0000005-0000-0000-0000-000000000005';

-- 8. the Grade B lot was not swept into the Grade A group
select is(
  (select count(*)::int from mega_lot_items
   where mega_lot_id = (select id from mega_lots where crop = 'onion' and grade = 'A' limit 1)),
  4,
  'a different-grade lot is not swept into an existing group'
);

-- Two 300 kg tomato Grade A lots, same crop and grade, more than 10 km
-- apart (about a degree of latitude ~ 111 km) - together they clear 500 kg,
-- but neither can see the other.
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status, location) values
  ('f0000006-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000001',
   'tomato', 300, 'A', 'L-MEGAT1', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000007-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000001',
   'tomato', 300, 'A', 'L-MEGAT2', 'draft', 'SRID=4326;POINT(73.79 21.0)');
update lots set status = 'listed' where id = 'f0000006-0000-0000-0000-000000000006';
update lots set status = 'listed' where id = 'f0000007-0000-0000-0000-000000000007';

-- 9. no mega lot forms when the only matching lots are more than 10 km apart
select is(
  (select count(*)::int from mega_lots where crop = 'tomato' and grade = 'A'),
  0,
  'lots more than 10 km apart never combine, even at a combined 600 kg'
);

-- Three 200 kg potato Grade A lots at the same point. The first gets a bid
-- before the others list - it must be excluded, so the remaining two
-- (400 kg) never reach the 500 kg target even though all three together
-- would (600 kg).
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status, location) values
  ('f0000008-0000-0000-0000-000000000008', 'e0000001-0000-0000-0000-000000000001',
   'potato', 200, 'A', 'L-MEGAP1', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000009-0000-0000-0000-000000000009', 'e0000001-0000-0000-0000-000000000001',
   'potato', 200, 'A', 'L-MEGAP2', 'draft', 'SRID=4326;POINT(73.79 20.0)'),
  ('f0000010-0000-0000-0000-000000000010', 'e0000001-0000-0000-0000-000000000001',
   'potato', 200, 'A', 'L-MEGAP3', 'draft', 'SRID=4326;POINT(73.79 20.0)');
update lots set status = 'listed' where id = 'f0000008-0000-0000-0000-000000000008';

insert into bids (lot_id, buyer_id, price_per_quintal_paise) values
  ('f0000008-0000-0000-0000-000000000008', 'e0000002-0000-0000-0000-000000000002', 150000);

update lots set status = 'listed' where id = 'f0000009-0000-0000-0000-000000000009';
update lots set status = 'listed' where id = 'f0000010-0000-0000-0000-000000000010';

-- 10. a lot that already has a bid is excluded from grouping, so the
-- remaining total never reaches the target
select is(
  (select count(*)::int from mega_lots where crop = 'potato' and grade = 'A'),
  0,
  'a lot that already has a bid is excluded, so the group never completes'
);

-- A single 600 kg lot is already truck-sized - it never bundles with anything.
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status, location) values
  ('f0000011-0000-0000-0000-000000000011', 'e0000001-0000-0000-0000-000000000001',
   'tomato', 600, 'B', 'L-MEGABIG', 'draft', 'SRID=4326;POINT(73.79 20.0)');
update lots set status = 'listed' where id = 'f0000011-0000-0000-0000-000000000011';

-- 11. a single lot at or above the target never creates a mega lot
select is(
  (select count(*)::int from mega_lot_items where lot_id = 'f0000011-0000-0000-0000-000000000011'),
  0,
  'a single lot already at the target never bundles'
);

-- 12. a lot cannot become a member of two mega lots - the unique(lot_id)
-- constraint on mega_lot_items holds even against a direct write
reset role;
select throws_ok(
  $$ insert into mega_lot_items (mega_lot_id, lot_id, farmer_id, quantity_kg)
     values ((select id from mega_lots where crop = 'onion' and grade = 'A' limit 1),
             'f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 150) $$,
  null, null,
  'a lot cannot join a second mega lot - unique constraint on lot_id'
);

select * from finish(true);
rollback;
