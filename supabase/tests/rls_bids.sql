-- RLS for `bids` and `rate_limits` (SPEC.md §5.6, §9.2 Phase 3 "3.3"). The
-- "every table has RLS on" CI guard already lives in rls_profiles.sql and
-- covers these two tables too, so this file only checks grants and select
-- scoping. place_bid.sql covers the actual bidding rules (verified/banned,
-- listed, floor, rate limit) - this file is about what a client can and
-- cannot touch directly. Everything here rolls back.
begin;
select plan(8);

insert into auth.users (id, phone) values
  ('d0000001-0000-0000-0000-000000000001', '0000000021'),
  ('d0000002-0000-0000-0000-000000000002', '0000000022'),
  ('d0000003-0000-0000-0000-000000000003', '0000000023');

insert into profiles (id, name, role, phone, kyc_status) values
  ('d0000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000021', 'pending'),
  ('d0000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000022', 'verified'),
  ('d0000003-0000-0000-0000-000000000003', 'Patil Agro', 'buyer', '0000000023', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTRLS1', 'listed'),
  ('e0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTRLS2', 'draft');

set local role authenticated;
set local request.jwt.claims to '{"sub":"d0000002-0000-0000-0000-000000000002","phone":"0000000022","role":"authenticated"}';

-- 1. no insert grant at all - place_bid (security definer) is the only writer
select throws_ok(
  $$ insert into bids (lot_id, buyer_id, price_per_quintal_paise)
     values ('e0000001-0000-0000-0000-000000000001', auth.uid(), 150000) $$,
  null, null,
  'a client cannot insert into bids directly - no grant'
);

-- one bid on the listed lot, one on the draft lot, inserted as the table
-- owner (bypasses RLS) so select scoping can be checked without depending
-- on place_bid.
reset role;
insert into bids (id, lot_id, buyer_id, price_per_quintal_paise) values
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001',
   'd0000003-0000-0000-0000-000000000003', 150000),
  ('f0000002-0000-0000-0000-000000000002', 'e0000002-0000-0000-0000-000000000002',
   'd0000003-0000-0000-0000-000000000003', 140000);

set local role authenticated;
set local request.jwt.claims to '{"sub":"d0000002-0000-0000-0000-000000000002","phone":"0000000022","role":"authenticated"}';

-- 2. a buyer sees another buyer's bid on a lot that is listed
select is(
  (select count(*)::int from bids where lot_id = 'e0000001-0000-0000-0000-000000000001'),
  1,
  'a buyer sees bids on a listed lot, even placed by another buyer'
);

-- 3. a buyer sees nothing on a lot that is still draft
select is(
  (select count(*)::int from bids where lot_id = 'e0000002-0000-0000-0000-000000000002'),
  0,
  'a buyer sees no bids on a draft lot'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d0000003-0000-0000-0000-000000000003","phone":"0000000023","role":"authenticated"}';

-- 4. the bidder can always see their own bid on the draft lot, through
-- bids_select_own even though bids_select_listed would not show it
select is(
  (select count(*)::int from bids where id = 'f0000002-0000-0000-0000-000000000002'),
  1,
  'a buyer always sees their own bid, even once the lot is no longer listed'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d0000002-0000-0000-0000-000000000002","phone":"0000000022","role":"authenticated"}';

-- 5. no update grant
select throws_ok(
  $$ update bids set status = 'accepted' where id = 'f0000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot update a bid - no grant (accept_bid, 3.6, will use service role)'
);

-- 6. no delete grant
select throws_ok(
  $$ delete from bids where id = 'f0000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot delete a bid - no grant'
);

-- 7. rate_limits is fully locked down: no select grant
select throws_ok(
  $$ select count(*) from rate_limits $$,
  null, null,
  'a client cannot read rate_limits - no grant, only place_bid touches it'
);

-- 8. rate_limits: no insert grant either
select throws_ok(
  $$ insert into rate_limits (key) values ('bid:d0000002-0000-0000-0000-000000000002') $$,
  null, null,
  'a client cannot write rate_limits directly - no grant'
);

select * from finish(true);
rollback;
