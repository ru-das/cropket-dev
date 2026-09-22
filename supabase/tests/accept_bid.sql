-- Tests for accept_bid() (20260923160000_deals.sql, reopened by
-- 20260923180000_accept_bid_escrow.sql to also create the escrow,
-- SPEC.md §4.13, §5.3, §9.2 Phase 3 "3.6" / Phase 4 "4.1"). Verifies: the
-- happy path creates a deal with the right money math and pickup date,
-- an escrow in CREATED for deal total + fee, and its creation event;
-- accepts the winning bid, rejects every other active bid on the lot, and
-- sells the lot; another farmer, the bidder themselves, a rejected bid, an
-- in_mega lot and a consent path under the wrong folder are all refused; a
-- repeated call is idempotent (same deal id and escrow id, no second row).
-- Bids/lots inserted directly as the table owner (bypasses RLS/place_bid)
-- - place_bid.sql and lot_bids.sql already cover insertion and reading.
-- Everything here rolls back.
begin;
select plan(14);

insert into auth.users (id, phone) values
  ('c1000001-0000-0000-0000-000000000001', '0000000041'),
  ('c1000002-0000-0000-0000-000000000002', '0000000042'),
  ('c1000003-0000-0000-0000-000000000003', '0000000043'),
  ('c1000004-0000-0000-0000-000000000004', '0000000044');

insert into profiles (id, name, role, phone, kyc_status) values
  ('c1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000041', 'pending'),
  ('c1000002-0000-0000-0000-000000000002', 'Suresh', 'farmer', '0000000042', 'pending'),
  ('c1000003-0000-0000-0000-000000000003', 'Sharma Traders', 'buyer', '0000000043', 'verified'),
  ('c1000004-0000-0000-0000-000000000004', 'Patil Agro', 'buyer', '0000000044', 'verified');

-- lot under test for the happy path: two active bids, one winner one loser.
insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('c2000001-0000-0000-0000-000000000001', 'c1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTAB1', 'listed'),
  ('c2000002-0000-0000-0000-000000000002', 'c1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTAB2', 'listed'),
  ('c2000003-0000-0000-0000-000000000003', 'c1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTAB3', 'listed'),
  ('c2000004-0000-0000-0000-000000000004', 'c1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTAB4', 'in_mega');

insert into bids (id, lot_id, buyer_id, price_per_quintal_paise, status) values
  ('c3000001-0000-0000-0000-000000000001', 'c2000001-0000-0000-0000-000000000001',
   'c1000003-0000-0000-0000-000000000003', 190000, 'active'),
  ('c3000002-0000-0000-0000-000000000002', 'c2000001-0000-0000-0000-000000000001',
   'c1000004-0000-0000-0000-000000000004', 150000, 'active'),
  ('c3000003-0000-0000-0000-000000000003', 'c2000002-0000-0000-0000-000000000002',
   'c1000003-0000-0000-0000-000000000003', 160000, 'active'),
  ('c3000004-0000-0000-0000-000000000004', 'c2000003-0000-0000-0000-000000000003',
   'c1000003-0000-0000-0000-000000000003', 160000, 'rejected'),
  ('c3000005-0000-0000-0000-000000000005', 'c2000004-0000-0000-0000-000000000004',
   'c1000003-0000-0000-0000-000000000003', 160000, 'active');

-- 1. the function exists with the expected signature
select has_function(
  'public', 'accept_bid', ARRAY['uuid', 'text'],
  'accept_bid(uuid, text) exists'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"c1000002-0000-0000-0000-000000000002","phone":"0000000042","role":"authenticated"}';

-- 2. another farmer cannot accept a bid on a lot that isn't theirs
select throws_ok(
  $$ select * from accept_bid('c3000003-0000-0000-0000-000000000003',
       'c1000002-0000-0000-0000-000000000002/x.webm') $$,
  null, 'LOT_NOT_FOUND',
  'a farmer cannot accept a bid on another farmer''s lot'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"c1000003-0000-0000-0000-000000000003","phone":"0000000043","role":"authenticated"}';

-- 3. the bidder themselves cannot call accept_bid - same error, no leak
select throws_ok(
  $$ select * from accept_bid('c3000003-0000-0000-0000-000000000003',
       'c1000003-0000-0000-0000-000000000003/x.webm') $$,
  null, 'LOT_NOT_FOUND',
  'a buyer cannot accept their own bid - accept_bid is the farmer''s action'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"c1000001-0000-0000-0000-000000000001","phone":"0000000041","role":"authenticated"}';

-- 4. a consent path outside the caller's own storage folder is refused
select throws_ok(
  $$ select * from accept_bid('c3000001-0000-0000-0000-000000000001',
       'c1000003-0000-0000-0000-000000000003/x.webm') $$,
  null, 'CONSENT_REQUIRED',
  'a consent path under someone else''s folder is refused'
);

-- 5. a rejected bid cannot be accepted
select throws_ok(
  $$ select * from accept_bid('c3000004-0000-0000-0000-000000000004',
       'c1000001-0000-0000-0000-000000000001/x.webm') $$,
  null, 'BID_NOT_ACTIVE',
  'a rejected bid cannot be accepted'
);

-- 6. a bid on an in_mega lot cannot be accepted this way (SPEC §5.3 gives
-- mega-lot accept to the FPO - still the gap 3.4/3.5 documented)
select throws_ok(
  $$ select * from accept_bid('c3000005-0000-0000-0000-000000000005',
       'c1000001-0000-0000-0000-000000000001/x.webm') $$,
  null, 'LOT_NOT_LISTED',
  'a bid on an in_mega lot cannot be accepted'
);

-- The happy-path call is its own statement, not joined with a read of
-- `deals` in the same query - a set-returning function's INSERT is only
-- visible to a later command in this transaction, not to a table scan
-- sharing its own statement's snapshot (a real Postgres MVCC gotcha, not a
-- pgTAP one).
select accept_bid('c3000001-0000-0000-0000-000000000001',
  'c1000001-0000-0000-0000-000000000001/c3000001.webm');

-- 7. happy path: the deal is created with the right money math and pickup date
select results_eq(
  $$ select total_paise, fee_paise, pickup_date
     from deals where lot_id = 'c2000001-0000-0000-0000-000000000001' $$,
  $$ values (950000::bigint, 9500::bigint, ((now() at time zone 'Asia/Kolkata')::date) + 2) $$,
  'accept_bid creates a deal with total_paise, fee_paise and pickup_date all correct'
);

-- 8-10 check accept_bid's writes as the table owner, not as the farmer -
-- once the lot is 'sold', bids_select_listed (which needs 'listed') no
-- longer shows either bid to the farmer, and bids_select_own only ever
-- covered the bidder, not the lot's farmer (the same reason 3.5 needed
-- lot_bids() as a security definer wrapper instead of a plain RLS read).
-- That visibility gap is rls_bids.sql/rls_deals.sql territory, not this
-- file's - here we're checking accept_bid's own writes landed correctly.
reset role;

-- 8. the winning bid is now accepted
select is(
  (select status::text from bids where id = 'c3000001-0000-0000-0000-000000000001'),
  'accepted',
  'the accepted bid is marked accepted'
);

-- 9. the other active bid on the same lot is rejected
select is(
  (select status::text from bids where id = 'c3000002-0000-0000-0000-000000000002'),
  'rejected',
  'the losing bid on the same lot is rejected'
);

-- 10. the lot is sold
select is(
  (select status::text from lots where id = 'c2000001-0000-0000-0000-000000000001'),
  'sold',
  'the lot is marked sold once a bid is accepted'
);

-- 11. the escrow is created in CREATED, holding deal total + fee (decided
-- with the user: the escrow holds everything the buyer pays)
select results_eq(
  $$ select e.state::text, e.total_paise
     from escrows e join deals d on d.id = e.deal_id
     where d.lot_id = 'c2000001-0000-0000-0000-000000000001' $$,
  $$ values ('CREATED', 959500::bigint) $$,
  'accept_bid creates an escrow in CREATED for deal total + fee'
);

-- 12. the escrow's creation event is written (null -> CREATED)
select is(
  (select count(*)::int from escrow_events ev
   join escrows e on e.id = ev.escrow_id
   join deals d on d.id = e.deal_id
   where d.lot_id = 'c2000001-0000-0000-0000-000000000001'
     and ev.from_state is null and ev.to_state = 'CREATED'),
  1,
  'accept_bid writes the escrow''s creation event'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"c1000001-0000-0000-0000-000000000001","phone":"0000000041","role":"authenticated"}';

-- 13. a repeat call is idempotent: same deal id, no second deal row
select is(
  (select a.deal_id from accept_bid('c3000001-0000-0000-0000-000000000001',
     'c1000001-0000-0000-0000-000000000001/again.webm') a),
  (select id from deals where lot_id = 'c2000001-0000-0000-0000-000000000001'),
  'a repeated accept_bid call for the same lot returns the existing deal, not a new one'
);

-- 14. ...and the same escrow id, not a second escrow row
select is(
  (select a.escrow_id from accept_bid('c3000001-0000-0000-0000-000000000001',
     'c1000001-0000-0000-0000-000000000001/again.webm') a),
  (select id from escrows where deal_id = (select id from deals where lot_id = 'c2000001-0000-0000-0000-000000000001')),
  'a repeated accept_bid call returns the existing escrow, not a new one'
);

select * from finish(true);
rollback;
