-- Tests for place_bid() (SPEC.md §5.3, §9.2 Phase 3 "3.3", mega_lot branch
-- added in "3.4").
-- Verifies: a verified, non-banned buyer can bid on a listed lot or a listed
-- mega lot; is_highest tracks the current top bid; a below-floor bid still
-- succeeds (advisory only); unverified/banned buyers and non-listed/unknown
-- targets are refused; an unsupported target_type is refused; the
-- 10-per-minute rate limit trips (shared across lot and mega_lot bids - one
-- buyer, one key). Everything here rolls back.
begin;
select plan(13);

insert into auth.users (id, phone) values
  ('a0000001-0000-0000-0000-000000000001', '0000000011'),
  ('a0000002-0000-0000-0000-000000000002', '0000000012'),
  ('a0000003-0000-0000-0000-000000000003', '0000000013'),
  ('a0000004-0000-0000-0000-000000000004', '0000000014');

insert into profiles (id, name, role, phone, kyc_status, banned) values
  ('a0000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000011', 'pending', false),
  ('a0000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000012', 'verified', false),
  ('a0000003-0000-0000-0000-000000000003', 'Patil Agro', 'buyer', '0000000013', 'pending', false),
  ('a0000004-0000-0000-0000-000000000004', 'Banned Co', 'buyer', '0000000014', 'verified', true);

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTBID1', 'listed'),
  ('b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTBID2', 'draft');

insert into mega_lots (id, crop, grade, total_kg, location, status) values
  ('b1000001-0000-0000-0000-000000000001', 'onion', 'B', 600, 'SRID=4326;POINT(73.79 20.0)', 'listed');

-- Isolate the floor calculation from whatever onion history the live
-- cropket-dev seed already has - this whole transaction rolls back, so
-- deleting the real rows here is safe. Nearest-rank 20th percentile of
-- (1000, 1200, 1400, 1600, 1800) rupees/quintal is the smallest, ₹1000
-- (100000 paise) - matches floor.ts's percentile20().
delete from mandi_prices where crop = 'onion';

insert into mandis (id, name, location) values
  ('c0000001-0000-0000-0000-000000000001', 'Test Mandi', 'SRID=4326;POINT(73.79 20.0)');

insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
select
  'c0000001-0000-0000-0000-000000000001',
  'onion',
  current_date - (n * 5),
  (80000 + n * 20000)::bigint,
  (120000 + n * 20000)::bigint,
  (100000 + n * 20000)::bigint,
  50,
  'seed'
from generate_series(0, 4) as n;

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000002-0000-0000-0000-000000000002","phone":"0000000012","role":"authenticated"}';

-- 1. the function exists with the expected signature
select has_function(
  'public', 'place_bid', ARRAY['text', 'uuid', 'bigint'],
  'place_bid(text, uuid, bigint) exists'
);

-- 2. first bid on the lot: above the floor, and the only bid so far -> highest
select results_eq(
  $$ select (bid_id is not null), is_highest, below_floor
     from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 150000::bigint) $$,
  $$ values (true, true, false) $$,
  'a verified buyer''s first bid is inserted and is the highest, above the floor'
);

-- 3. a second, lower bid from the same buyer is not the highest
select results_eq(
  $$ select is_highest, below_floor
     from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 140000::bigint) $$,
  $$ values (false, false) $$,
  'a lower bid than the current top is not the highest'
);

-- 4. a higher bid becomes the highest again
select results_eq(
  $$ select is_highest
     from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 160000::bigint) $$,
  $$ values (true) $$,
  'a new top bid is the highest'
);

-- 5. a below-floor bid still succeeds - advisory only, never blocked
select results_eq(
  $$ select below_floor
     from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 90000::bigint) $$,
  $$ values (true) $$,
  'a below-floor bid is still inserted, flagged below_floor - it never blocks'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000003-0000-0000-0000-000000000003","phone":"0000000013","role":"authenticated"}';

-- 6. an unverified buyer cannot bid
select throws_ok(
  $$ select * from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 150000::bigint) $$,
  null, 'BUYER_NOT_VERIFIED',
  'an unverified buyer cannot bid'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000004-0000-0000-0000-000000000004","phone":"0000000014","role":"authenticated"}';

-- 7. a verified but banned buyer cannot bid
select throws_ok(
  $$ select * from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 150000::bigint) $$,
  null, 'BUYER_NOT_VERIFIED',
  'a banned buyer cannot bid even if verified'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000002-0000-0000-0000-000000000002","phone":"0000000012","role":"authenticated"}';

-- 8. a lot that is not listed (still draft) cannot be bid on
select throws_ok(
  $$ select * from place_bid('lot', 'b0000002-0000-0000-0000-000000000002', 150000::bigint) $$,
  null, 'LOT_NOT_LISTED',
  'a draft lot cannot be bid on'
);

-- 9. an unknown lot id cannot be bid on
select throws_ok(
  $$ select * from place_bid('lot', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 150000::bigint) $$,
  null, 'LOT_NOT_LISTED',
  'an unknown lot id cannot be bid on'
);

-- 10. a verified buyer can also bid on a listed mega lot - same function,
-- same rules, just a different target table
select results_eq(
  $$ select (bid_id is not null), is_highest, below_floor
     from place_bid('mega_lot', 'b1000001-0000-0000-0000-000000000001', 175000::bigint) $$,
  $$ values (true, true, false) $$,
  'a verified buyer can bid on a listed mega lot'
);

reset role;
update mega_lots set status = 'sold' where id = 'b1000001-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000002-0000-0000-0000-000000000002","phone":"0000000012","role":"authenticated"}';

-- 11. a mega lot that is no longer listed cannot be bid on - same error a
-- non-listed lot gives, not a new code
select throws_ok(
  $$ select * from place_bid('mega_lot', 'b1000001-0000-0000-0000-000000000001', 175000::bigint) $$,
  null, 'LOT_NOT_LISTED',
  'a sold mega lot cannot be bid on'
);

-- 12. anything outside lot/mega_lot is still refused
select throws_ok(
  $$ select * from place_bid('flash_sale', 'b0000001-0000-0000-0000-000000000001', 150000::bigint) $$,
  null, 'UNSUPPORTED_TARGET',
  'an unknown target_type is refused'
);

-- 13. rate limit: 5 bids already placed above by this buyer this minute
-- (asserts 2-5 and the mega-lot bid in 10; asserts 6-9, 11, 12 all fail
-- before the rate-limit step, so they don't count). 5 more (quietly, no
-- assertion) brings the count to 10, and the 11th trips the limit. The
-- raise below rolls its own count bump back, so a retry after the window
-- rolls over is never permanently stuck.
do $$
begin
  for i in 1..5 loop
    perform place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 150000::bigint);
  end loop;
end;
$$;

select throws_ok(
  $$ select * from place_bid('lot', 'b0000001-0000-0000-0000-000000000001', 150000::bigint) $$,
  null, 'RATE_LIMITED',
  'an 11th bid inside one minute is rate-limited'
);

select * from finish(true);
rollback;
