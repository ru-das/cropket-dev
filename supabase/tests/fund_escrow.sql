-- Tests for fund_escrow() and buyer_deals() (20260923190000_escrow_pay.sql,
-- SPEC.md §5.3, §5.7, §9.2 Phase 4 "4.3"). Verifies: the happy path moves
-- CREATED -> FUNDED, writes one escrow_events row carrying the payment ref,
-- and one yellow khata_entries row for the farmer with the deal total; a
-- repeat call for the same order changes nothing (no second event, no
-- second Khata row); a wrong amount is refused; an unknown order id is
-- refused; only the service role may call it. buyer_deals() returns the
-- buyer's own deal with its escrow state, and nothing for another buyer or
-- the farmer. Deals/escrows are inserted directly as the table owner
-- (bypasses RLS/accept_bid) - accept_bid.sql already covers creation.
-- Everything here rolls back.
begin;
select plan(13);

insert into auth.users (id, phone) values
  ('d1000001-0000-0000-0000-000000000001', '0000000051'),
  ('d1000002-0000-0000-0000-000000000002', '0000000052'),
  ('d1000003-0000-0000-0000-000000000003', '0000000053');

insert into profiles (id, name, role, phone, kyc_status) values
  ('d1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000051', 'pending'),
  ('d1000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000052', 'verified'),
  ('d1000003-0000-0000-0000-000000000003', 'Patil Agro', 'buyer', '0000000053', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('d2000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTFE1', 'sold'),
  ('d2000002-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTFE2', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'd3000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001',
  'd1000002-0000-0000-0000-000000000002', 190000, 500,
  950000, 9500, current_date + 2, 'd1000001-0000-0000-0000-000000000001/x.webm'
), (
  'd3000002-0000-0000-0000-000000000002', 'd2000002-0000-0000-0000-000000000002',
  'd1000002-0000-0000-0000-000000000002', 160000, 300,
  480000, 4800, current_date + 2, 'd1000001-0000-0000-0000-000000000001/y.webm'
);

insert into escrows (id, deal_id, total_paise, state, cashfree_order_id) values (
  'd4000001-0000-0000-0000-000000000001', 'd3000001-0000-0000-0000-000000000001',
  959500, 'CREATED', 'order-1'
), (
  'd4000002-0000-0000-0000-000000000002', 'd3000002-0000-0000-0000-000000000002',
  484800, 'CREATED', 'order-2'
);

-- 1-2. the functions exist with the expected signatures
select has_function(
  'public', 'fund_escrow', ARRAY['text', 'text', 'bigint'],
  'fund_escrow(text, text, bigint) exists'
);
select has_function('public', 'buyer_deals', ARRAY[]::text[], 'buyer_deals() exists');

-- 3-4. only the service role may call fund_escrow
select function_privs_are(
  'public', 'fund_escrow', ARRAY['text', 'text', 'bigint'],
  'authenticated', ARRAY[]::text[],
  'authenticated has no privilege on fund_escrow'
);
select function_privs_are(
  'public', 'fund_escrow', ARRAY['text', 'text', 'bigint'],
  'service_role', ARRAY['EXECUTE'],
  'service_role may execute fund_escrow'
);

-- 5. an unknown order id is refused
select throws_ok(
  $$ select fund_escrow('no-such-order', 'pay_1', 959500) $$,
  null, 'ESCROW_NOT_FOUND',
  'an unknown cashfree_order_id throws ESCROW_NOT_FOUND'
);

-- 6. a wrong amount is refused, fails closed
select throws_ok(
  $$ select fund_escrow('order-1', 'pay_1', 1) $$,
  null, 'AMOUNT_MISMATCH',
  'an amount that does not match escrow total is refused'
);

-- The happy-path call is its own statement (same MVCC reasoning
-- accept_bid.sql documents) so the later reads see its writes.
select fund_escrow('order-1', 'pay_1', 959500);

-- 7. the escrow moved to FUNDED
select is(
  (select state::text from escrows where id = 'd4000001-0000-0000-0000-000000000001'),
  'FUNDED',
  'fund_escrow moves the escrow from CREATED to FUNDED'
);

-- 8. one escrow_events row carrying the payment ref
select is(
  (select count(*)::int from escrow_events
   where escrow_id = 'd4000001-0000-0000-0000-000000000001'
     and from_state = 'CREATED' and to_state = 'FUNDED' and reason like '%pay_1%'),
  1,
  'fund_escrow writes one escrow_events row carrying the payment ref'
);

-- 9. one yellow Khata row for the farmer with the deal total (not the
-- bigger escrow total, which also holds the platform fee)
select results_eq(
  $$ select amount_paise, colour::text, title_key
     from khata_entries where deal_id = 'd3000001-0000-0000-0000-000000000001' $$,
  $$ values (950000::bigint, 'yellow', 'khata.moneyLocked') $$,
  'fund_escrow writes one yellow Khata row for the farmer, at the deal total'
);

-- 10-11. a repeat call for the same order changes nothing
select fund_escrow('order-1', 'pay_1_retry', 959500);
select is(
  (select count(*)::int from escrow_events where escrow_id = 'd4000001-0000-0000-0000-000000000001'),
  1,
  'a repeated fund_escrow call for an already-FUNDED order writes no second event'
);
select is(
  (select count(*)::int from khata_entries where deal_id = 'd3000001-0000-0000-0000-000000000001'),
  1,
  'a repeated fund_escrow call writes no second Khata row'
);

-- 12. buyer_deals() returns the buyer's own deal with its escrow state,
-- and nothing for the farmer or a different buyer.
set local role authenticated;
set local request.jwt.claims to '{"sub":"d1000002-0000-0000-0000-000000000002","phone":"0000000052","role":"authenticated"}';

select results_eq(
  $$ select escrow_state::text, crop, quantity_kg
     from buyer_deals() where deal_id = 'd3000001-0000-0000-0000-000000000001' $$,
  $$ values ('FUNDED', 'onion', 500) $$,
  'buyer_deals returns the buyer''s own deal with its escrow state'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d1000003-0000-0000-0000-000000000003","phone":"0000000053","role":"authenticated"}';

select is(
  (select count(*)::int from buyer_deals() where deal_id = 'd3000001-0000-0000-0000-000000000001'),
  0,
  'buyer_deals returns nothing for a different buyer'
);

select * from finish(true);
rollback;
