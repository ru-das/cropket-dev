-- Tests for lot_bids() and the bids_reject_own_lot policy
-- (20260923100000_lot_bids.sql, SPEC.md §4.12, §5.3, §9.2 Phase 3 "3.5").
-- Verifies: the lot's own farmer reads their bids with the buyer's business
-- name, best price first, rejected bids excluded; a different farmer is
-- refused; the farmer can reject a bid on their own lot; a buyer cannot
-- reject anyone's bid; a bid cannot be flipped straight to 'accepted'
-- (accept_bid, 3.6, owns that); the price itself cannot be edited. Bids
-- inserted directly as the table owner (bypasses RLS/place_bid) since only
-- the read/reject paths are under test here - place_bid.sql already covers
-- insertion. Everything here rolls back.
begin;
select plan(9);

insert into auth.users (id, phone) values
  ('a1000001-0000-0000-0000-000000000001', '0000000031'),
  ('a1000002-0000-0000-0000-000000000002', '0000000032'),
  ('a1000003-0000-0000-0000-000000000003', '0000000033'),
  ('a1000004-0000-0000-0000-000000000004', '0000000034');

insert into profiles (id, name, role, phone, kyc_status) values
  ('a1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000031', 'pending'),
  ('a1000002-0000-0000-0000-000000000002', 'Suresh', 'farmer', '0000000032', 'pending'),
  ('a1000003-0000-0000-0000-000000000003', 'Sharma Traders', 'buyer', '0000000033', 'verified'),
  ('a1000004-0000-0000-0000-000000000004', 'Patil Agro', 'buyer', '0000000034', 'verified');

insert into buyer_kyc (buyer_id, business_name, gst_number, pan_last4, status, source) values
  ('a1000003-0000-0000-0000-000000000003', 'Sharma Traders', '27ABCDE1234F1Z5', 'F1Z5', 'verified', 'mock'),
  ('a1000004-0000-0000-0000-000000000004', 'Patil Agro', '27ABCDE5678G1Z2', 'G1Z2', 'verified', 'mock');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('a2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTLB1', 'listed');

insert into bids (id, lot_id, buyer_id, price_per_quintal_paise, status) values
  ('a3000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001',
   'a1000003-0000-0000-0000-000000000003', 150000, 'active'),
  ('a3000002-0000-0000-0000-000000000002', 'a2000001-0000-0000-0000-000000000001',
   'a1000004-0000-0000-0000-000000000004', 190000, 'active'),
  ('a3000003-0000-0000-0000-000000000003', 'a2000001-0000-0000-0000-000000000001',
   'a1000003-0000-0000-0000-000000000003', 200000, 'rejected');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a1000001-0000-0000-0000-000000000001","phone":"0000000031","role":"authenticated"}';

-- 1. the function exists with the expected signature
select has_function(
  'public', 'lot_bids', ARRAY['uuid'],
  'lot_bids(uuid) exists'
);

-- 2. the lot's own farmer sees both active bids, best price first
select results_eq(
  $$ select price_per_quintal_paise, buyer_name, buyer_verified
     from lot_bids('a2000001-0000-0000-0000-000000000001') $$,
  $$ values (190000::bigint, 'Patil Agro', true), (150000::bigint, 'Sharma Traders', true) $$,
  'the farmer sees their lot''s active bids, best price first, with buyer name'
);

-- 3. the rejected bid is not returned
select is(
  (select count(*)::int from lot_bids('a2000001-0000-0000-0000-000000000001')
   where bid_id = 'a3000003-0000-0000-0000-000000000003'),
  0,
  'a rejected bid does not appear in lot_bids'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1000002-0000-0000-0000-000000000002","phone":"0000000032","role":"authenticated"}';

-- 4. a different farmer cannot read this lot's bids
select throws_ok(
  $$ select * from lot_bids('a2000001-0000-0000-0000-000000000001') $$,
  null, 'LOT_NOT_FOUND',
  'a farmer cannot read another farmer''s lot bids'
);

-- 5. an unknown lot id gives the same error, not a different one
select throws_ok(
  $$ select * from lot_bids('ffffffff-ffff-ffff-ffff-ffffffffffff') $$,
  null, 'LOT_NOT_FOUND',
  'an unknown lot id gives LOT_NOT_FOUND, same as "not yours"'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1000003-0000-0000-0000-000000000003","phone":"0000000033","role":"authenticated"}';

-- 6. the buyer cannot reject their own bid - only the lot's farmer can
with upd as (
  update bids set status = 'rejected'
  where id = 'a3000001-0000-0000-0000-000000000001'
  returning 1
)
select is(
  (select count(*)::int from upd),
  0,
  'a buyer cannot reject their own bid - RLS only allows the lot''s farmer'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1000001-0000-0000-0000-000000000001","phone":"0000000031","role":"authenticated"}';

-- 7. the farmer can reject a bid on their own lot
with upd as (
  update bids set status = 'rejected'
  where id = 'a3000001-0000-0000-0000-000000000001'
  returning status::text
)
select is(
  (select status from upd),
  'rejected',
  'the farmer can reject a bid on their own lot'
);

-- 8. the farmer cannot accept a bid this way - with check only allows 'rejected'
select throws_ok(
  $$ update bids set status = 'accepted'
     where id = 'a3000002-0000-0000-0000-000000000002' $$,
  null, null,
  'the farmer cannot flip a bid straight to accepted - accept_bid (3.6) owns that'
);

-- 9. the farmer cannot edit the bid price - no column grant
select throws_ok(
  $$ update bids set price_per_quintal_paise = 1
     where id = 'a3000002-0000-0000-0000-000000000002' $$,
  null, null,
  'the farmer cannot edit a bid''s price - no column grant'
);

select * from finish(true);
rollback;
