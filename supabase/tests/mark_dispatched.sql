-- Tests for mark_dispatched() (20260923210000_mark_dispatched.sql,
-- SPEC.md §5.3, §5.7, §9.2 Phase 4 "4.6"). Verifies: the farmer moves their
-- own FUNDED escrow to IN_TRANSIT, writing exactly one escrow_events row
-- (actor = the farmer) and one blue khata_entries row at the deal total;
-- a repeat call is idempotent (no second event, no second Khata row); the
-- buyer and another farmer both get ESCROW_NOT_FOUND (same error, no
-- ownership leak); a CREATED escrow is refused with ESCROW_WRONG_STATE; an
-- unknown id throws ESCROW_NOT_FOUND; anon cannot call it at all. Deals/
-- escrows are inserted directly as the table owner (bypasses RLS/
-- accept_bid/fund_escrow) - accept_bid.sql and fund_escrow.sql already
-- cover creation. Everything here rolls back.
begin;
select plan(11);

insert into auth.users (id, phone) values
  ('e1000001-0000-0000-0000-000000000001', '0000000061'),
  ('e1000002-0000-0000-0000-000000000002', '0000000062'),
  ('e1000003-0000-0000-0000-000000000003', '0000000063'),
  ('e1000004-0000-0000-0000-000000000004', '0000000064');

insert into profiles (id, name, role, phone, kyc_status) values
  ('e1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000061', 'pending'),
  ('e1000002-0000-0000-0000-000000000002', 'Suresh', 'farmer', '0000000062', 'pending'),
  ('e1000003-0000-0000-0000-000000000003', 'Sharma Traders', 'buyer', '0000000063', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('e2000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTMD1', 'sold'),
  ('e2000002-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTMD2', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'e3000001-0000-0000-0000-000000000001', 'e2000001-0000-0000-0000-000000000001',
  'e1000003-0000-0000-0000-000000000003', 190000, 500,
  950000, 9500, current_date + 2, 'e1000001-0000-0000-0000-000000000001/x.webm'
), (
  'e3000002-0000-0000-0000-000000000002', 'e2000002-0000-0000-0000-000000000002',
  'e1000003-0000-0000-0000-000000000003', 160000, 300,
  480000, 4800, current_date + 2, 'e1000001-0000-0000-0000-000000000001/y.webm'
);

insert into escrows (id, deal_id, total_paise, state) values (
  'e4000001-0000-0000-0000-000000000001', 'e3000001-0000-0000-0000-000000000001',
  959500, 'FUNDED'
), (
  'e4000002-0000-0000-0000-000000000002', 'e3000002-0000-0000-0000-000000000002',
  484800, 'CREATED'
);

-- 1. the function exists with the expected signature
select has_function(
  'public', 'mark_dispatched', ARRAY['uuid'],
  'mark_dispatched(uuid) exists'
);

-- 2. anon has no privilege at all
select function_privs_are(
  'public', 'mark_dispatched', ARRAY['uuid'],
  'anon', ARRAY[]::text[],
  'anon has no privilege on mark_dispatched'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"e1000003-0000-0000-0000-000000000003","phone":"0000000063","role":"authenticated"}';

-- 3. the buyer cannot dispatch their own deal - same error as an unknown id
select throws_ok(
  $$ select mark_dispatched('e4000001-0000-0000-0000-000000000001') $$,
  null, 'ESCROW_NOT_FOUND',
  'the buyer cannot call mark_dispatched on their own deal'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"e1000002-0000-0000-0000-000000000002","phone":"0000000062","role":"authenticated"}';

-- 4. another farmer cannot dispatch a lot that isn't theirs
select throws_ok(
  $$ select mark_dispatched('e4000001-0000-0000-0000-000000000001') $$,
  null, 'ESCROW_NOT_FOUND',
  'another farmer cannot call mark_dispatched on someone else''s escrow'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"e1000001-0000-0000-0000-000000000001","phone":"0000000061","role":"authenticated"}';

-- 5. a CREATED escrow (not yet FUNDED) is refused
select throws_ok(
  $$ select mark_dispatched('e4000002-0000-0000-0000-000000000002') $$,
  null, 'ESCROW_WRONG_STATE',
  'a CREATED escrow cannot be marked dispatched'
);

-- 6. an unknown escrow id throws ESCROW_NOT_FOUND
select throws_ok(
  $$ select mark_dispatched(gen_random_uuid()) $$,
  null, 'ESCROW_NOT_FOUND',
  'an unknown escrow id throws ESCROW_NOT_FOUND'
);

-- 7. the happy path: the farmer moves their own FUNDED escrow to IN_TRANSIT
select is(
  mark_dispatched('e4000001-0000-0000-0000-000000000001'), 'IN_TRANSIT',
  'the farmer moves their own escrow from FUNDED to IN_TRANSIT'
);

-- escrow_events/khata_entries grant no client access at all (SPEC §5.6) -
-- reset to the table owner to read them directly, same as fund_escrow.sql.
reset role;

-- 8. exactly one new escrow_events row, actor = the farmer
select is(
  (select count(*)::int from escrow_events
   where escrow_id = 'e4000001-0000-0000-0000-000000000001'
     and from_state = 'FUNDED' and to_state = 'IN_TRANSIT'
     and actor = 'e1000001-0000-0000-0000-000000000001'),
  1,
  'mark_dispatched writes one FUNDED -> IN_TRANSIT event with the farmer as actor'
);

-- 9. exactly one blue Khata row at the deal total
select is(
  (select count(*)::int from khata_entries
   where deal_id = 'e3000001-0000-0000-0000-000000000001'
     and colour = 'blue' and title_key = 'khata.onTheWay' and amount_paise = 950000),
  1,
  'mark_dispatched writes one blue khata_entries row at the deal total'
);

-- 10. a repeat call is idempotent - no second event, no second Khata row
set local role authenticated;
set local request.jwt.claims to '{"sub":"e1000001-0000-0000-0000-000000000001","phone":"0000000061","role":"authenticated"}';
select is(
  mark_dispatched('e4000001-0000-0000-0000-000000000001'), 'IN_TRANSIT',
  'a repeat call returns IN_TRANSIT unchanged'
);
reset role;
select is(
  (select count(*)::int from escrow_events where escrow_id = 'e4000001-0000-0000-0000-000000000001'),
  1,
  'a repeat call writes no second escrow_events row'
);

select * from finish(true);
rollback;
