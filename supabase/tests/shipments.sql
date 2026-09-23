-- Tests for shipments/pods + record_pod() (20260923220000_shipments.sql,
-- SPEC.md §5.3, §5.6, §5.7, §9.2 Phase 4 "4.7"). Verifies: only the seller
-- (the lot's farmer) can see their own shipment row, never trip_token_hash;
-- a client can't insert a shipment at all; record_pod() moves an
-- IN_TRANSIT escrow to DELIVERED, sets auto_release_at to ~24h from now,
-- writes exactly one pod row, one escrow_events row and one yellow
-- khata_entries row; a repeat call changes nothing; a FUNDED (not yet
-- IN_TRANSIT) escrow is refused; an unknown shipment id is refused; only
-- the service role may call it. Shipments are inserted directly as the
-- table owner (bypasses RLS/shipments-create - that Edge Function can't be
-- exercised from SQL). Everything here rolls back.
begin;
select plan(18);

insert into auth.users (id, phone) values
  ('f1000001-0000-0000-0000-000000000001', '0000000071'),
  ('f1000002-0000-0000-0000-000000000002', '0000000072'),
  ('f1000003-0000-0000-0000-000000000003', '0000000073');

insert into profiles (id, name, role, phone, kyc_status) values
  ('f1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000071', 'pending'),
  ('f1000002-0000-0000-0000-000000000002', 'Suresh', 'farmer', '0000000072', 'pending'),
  ('f1000003-0000-0000-0000-000000000003', 'Sharma Traders', 'buyer', '0000000073', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('f2000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTSH1', 'sold'),
  ('f2000002-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTSH2', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'f3000001-0000-0000-0000-000000000001', 'f2000001-0000-0000-0000-000000000001',
  'f1000003-0000-0000-0000-000000000003', 190000, 500,
  950000, 9500, current_date + 2, 'f1000001-0000-0000-0000-000000000001/x.webm'
), (
  'f3000002-0000-0000-0000-000000000002', 'f2000002-0000-0000-0000-000000000002',
  'f1000003-0000-0000-0000-000000000003', 160000, 300,
  480000, 4800, current_date + 2, 'f1000001-0000-0000-0000-000000000001/y.webm'
);

-- Escrow 1 is IN_TRANSIT (the happy path); escrow 2 is FUNDED (not yet
-- dispatched - record_pod must refuse it).
insert into escrows (id, deal_id, total_paise, state) values (
  'f4000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000001',
  959500, 'IN_TRANSIT'
), (
  'f4000002-0000-0000-0000-000000000002', 'f3000002-0000-0000-0000-000000000002',
  484800, 'FUNDED'
);

insert into shipments (id, deal_id, driver_phone, vehicle_number, trip_token_hash, token_expires_at) values (
  'f5000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000001',
  '9876543210', 'MH15AB1234', 'a'||repeat('0', 63), now() + interval '72 hours'
), (
  'f5000002-0000-0000-0000-000000000002', 'f3000002-0000-0000-0000-000000000002',
  '9876543211', 'MH15CD5678', 'b'||repeat('0', 63), now() + interval '72 hours'
);

-- 1. the seller sees their own shipment
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000001-0000-0000-0000-000000000001","phone":"0000000071","role":"authenticated"}';
select is(
  (select vehicle_number from shipments where id = 'f5000001-0000-0000-0000-000000000001'),
  'MH15AB1234',
  'the seller sees their own shipment'
);

-- 2. trip_token_hash is not in the column grant - even the seller can't select it
select throws_ok(
  $$ select trip_token_hash from shipments where id = 'f5000001-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'trip_token_hash is not selectable, even by the seller'
);

-- 3. a client can't insert a shipment at all
select throws_ok(
  $$ insert into shipments (deal_id, driver_phone, vehicle_number, trip_token_hash, token_expires_at)
     values ('f3000001-0000-0000-0000-000000000001', '9876543210', 'MH15AB1234', 'c'||repeat('0', 63), now()) $$,
  '42501',
  null,
  'a client cannot insert a shipment row'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000003-0000-0000-0000-000000000003","phone":"0000000073","role":"authenticated"}';

-- 4. the buyer sees no shipment rows
select is(
  (select count(*)::int from shipments),
  0,
  'the buyer sees no shipment rows'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000002-0000-0000-0000-000000000002","phone":"0000000072","role":"authenticated"}';

-- 5. another farmer sees no shipment rows
select is(
  (select count(*)::int from shipments),
  0,
  'another farmer sees no shipment rows'
);

reset role;

-- 6-8. record_pod exists and only the service role may call it
select has_function(
  'public', 'record_pod', ARRAY['uuid', 'text', 'float8', 'float8', 'timestamptz'],
  'record_pod(uuid, text, double precision, double precision, timestamptz) exists'
);
select function_privs_are(
  'public', 'record_pod', ARRAY['uuid', 'text', 'float8', 'float8', 'timestamptz'],
  'authenticated', ARRAY[]::text[],
  'authenticated has no privilege on record_pod'
);
select function_privs_are(
  'public', 'record_pod', ARRAY['uuid', 'text', 'float8', 'float8', 'timestamptz'],
  'service_role', ARRAY['EXECUTE'],
  'service_role may execute record_pod'
);

-- 9. an unknown shipment id is refused
select throws_ok(
  $$ select record_pod(gen_random_uuid(), 'pod/x.jpg', 20.0, 74.0, now()) $$,
  null, 'SHIPMENT_NOT_FOUND',
  'an unknown shipment id throws SHIPMENT_NOT_FOUND'
);

-- 10. a FUNDED escrow (not yet dispatched) is refused
select throws_ok(
  $$ select record_pod('f5000002-0000-0000-0000-000000000002', 'pod/x.jpg', 20.0, 74.0, now()) $$,
  null, 'ESCROW_WRONG_STATE',
  'a FUNDED escrow cannot receive a delivery photo yet'
);

-- The happy-path call is its own statement (same MVCC reasoning
-- accept_bid.sql/fund_escrow.sql document) so the later reads see its
-- writes.
select record_pod('f5000001-0000-0000-0000-000000000001', 'pod/f5000001/1.jpg', 20.0, 74.0, now());

-- 11. the escrow moved to DELIVERED
select is(
  (select state::text from escrows where id = 'f4000001-0000-0000-0000-000000000001'),
  'DELIVERED',
  'record_pod moves the escrow from IN_TRANSIT to DELIVERED'
);

-- 12. auto_release_at is set to ~24h from now (escrow_transition's own rule)
select ok(
  (select auto_release_at from escrows where id = 'f4000001-0000-0000-0000-000000000001')
    between now() + interval '23 hours 55 minutes' and now() + interval '24 hours 5 minutes',
  'auto_release_at is set to about 24 hours from now'
);

-- 13. exactly one pod row, with the photo path given
select results_eq(
  $$ select photo_path from pods where shipment_id = 'f5000001-0000-0000-0000-000000000001' $$,
  $$ values ('pod/f5000001/1.jpg') $$,
  'record_pod writes exactly one pod row with the given photo path'
);

-- 14. exactly one escrow_events row, IN_TRANSIT -> DELIVERED
select is(
  (select count(*)::int from escrow_events
   where escrow_id = 'f4000001-0000-0000-0000-000000000001'
     and from_state = 'IN_TRANSIT' and to_state = 'DELIVERED'),
  1,
  'record_pod writes one IN_TRANSIT -> DELIVERED event'
);

-- 15. exactly one yellow Khata row at the deal total
select results_eq(
  $$ select amount_paise, colour::text, title_key
     from khata_entries where deal_id = 'f3000001-0000-0000-0000-000000000001' $$,
  $$ values (950000::bigint, 'yellow', 'khata.deliveredLocked') $$,
  'record_pod writes one yellow Khata row at the deal total'
);

-- 16-18. a repeat call is idempotent - no second pod row, event or Khata row
select record_pod('f5000001-0000-0000-0000-000000000001', 'pod/f5000001/2.jpg', 21.0, 75.0, now());
select is(
  (select count(*)::int from pods where shipment_id = 'f5000001-0000-0000-0000-000000000001'),
  1,
  'a repeat call writes no second pod row'
);
select is(
  (select count(*)::int from escrow_events where escrow_id = 'f4000001-0000-0000-0000-000000000001'),
  1,
  'a repeat call writes no second escrow_events row'
);
select is(
  (select count(*)::int from khata_entries where deal_id = 'f3000001-0000-0000-0000-000000000001'),
  1,
  'a repeat call writes no second Khata row'
);

select * from finish(true);
rollback;
