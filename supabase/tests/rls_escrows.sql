-- RLS for `escrows`, `escrow_events`, `payouts`, `khata_entries`
-- (20260923170000_escrows.sql, SPEC.md §5.6, §9.2 Phase 4 "4.1"). The
-- "every table has RLS on" CI guard already lives in rls_profiles.sql and
-- covers all four tables here too - this file checks grants and select
-- scoping only. escrow_transition.sql covers the state-machine rules.
-- Everything here rolls back.
begin;
select plan(10);

insert into auth.users (id, phone) values
  ('f1000001-0000-0000-0000-000000000001', '0000000071'),
  ('f1000002-0000-0000-0000-000000000002', '0000000072'),
  ('f1000003-0000-0000-0000-000000000003', '0000000073');

insert into profiles (id, name, role, phone, kyc_status) values
  ('f1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000071', 'pending'),
  ('f1000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000072', 'verified'),
  ('f1000003-0000-0000-0000-000000000003', 'Patil Agro', 'buyer', '0000000073', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('f2000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTRLE1', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'f3000001-0000-0000-0000-000000000001', 'f2000001-0000-0000-0000-000000000001',
  'f1000002-0000-0000-0000-000000000002', 190000, 500,
  950000, 9500, current_date + 2,
  'f1000001-0000-0000-0000-000000000001/x.webm'
);

insert into escrows (id, deal_id, total_paise, state) values (
  'f4000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000001',
  959500, 'FUNDED'
);

insert into escrow_events (escrow_id, from_state, to_state, reason) values
  ('f4000001-0000-0000-0000-000000000001', 'CREATED', 'FUNDED', 'test fixture');

insert into payouts (escrow_id, to_user, amount_paise, type) values
  ('f4000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001',
   950000, 'farmer_share');

insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key) values
  ('f1000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000001',
   950000, 'yellow', 'khata.moneyLocked');

set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000001-0000-0000-0000-000000000001","phone":"0000000071","role":"authenticated"}';

-- 1. the lot's farmer sees the escrow (party of the deal it belongs to)
select is(
  (select count(*)::int from escrows where id = 'f4000001-0000-0000-0000-000000000001'),
  1,
  'the lot''s farmer sees the escrow'
);

-- 2. the farmer sees their own khata entry
select is(
  (select count(*)::int from khata_entries where deal_id = 'f3000001-0000-0000-0000-000000000001'),
  1,
  'the farmer sees their own khata entry'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000002-0000-0000-0000-000000000002","phone":"0000000072","role":"authenticated"}';

-- 3. the buyer of the deal sees the escrow too
select is(
  (select count(*)::int from escrows where id = 'f4000001-0000-0000-0000-000000000001'),
  1,
  'the buyer of the deal sees the escrow'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1000003-0000-0000-0000-000000000003","phone":"0000000073","role":"authenticated"}';

-- 4. a third party sees no escrow, and no khata entry that isn't theirs
select is(
  (select count(*)::int from escrows where id = 'f4000001-0000-0000-0000-000000000001'),
  0,
  'a third party sees nothing on the escrow'
);
select is(
  (select count(*)::int from khata_entries where deal_id = 'f3000001-0000-0000-0000-000000000001'),
  0,
  'a third party sees nothing on the khata entry'
);

-- 5-8. no client can write escrows, payouts or khata_entries at all -
-- money moves only through escrow_transition() / accept_bid() (service
-- role or security definer), never a direct client insert/update/delete.
select throws_like(
  $$ insert into escrows (deal_id, total_paise) values ('f3000001-0000-0000-0000-000000000001', 1) $$,
  '%permission denied%', 'a client cannot insert an escrow'
);
select throws_like(
  $$ update escrows set state = 'RELEASED' where id = 'f4000001-0000-0000-0000-000000000001' $$,
  '%permission denied%', 'a client cannot update an escrow'
);
select throws_like(
  $$ insert into payouts (escrow_id, to_user, amount_paise, type)
     values ('f4000001-0000-0000-0000-000000000001', 'f1000003-0000-0000-0000-000000000003', 1, 'refund') $$,
  '%permission denied%', 'a client cannot insert a payout'
);
select throws_like(
  $$ insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key)
     values ('f1000003-0000-0000-0000-000000000003', 'f3000001-0000-0000-0000-000000000001', 1, 'green', 'x') $$,
  '%permission denied%', 'a client cannot insert a khata entry'
);

-- 9. escrow_events is insert-only, even for the service role - no update
-- or delete grant at all, not just an RLS policy a service-role call
-- could bypass.
reset role;
set local role service_role;
select throws_like(
  $$ update escrow_events set reason = 'tampered' where escrow_id = 'f4000001-0000-0000-0000-000000000001' $$,
  '%permission denied%', 'escrow_events cannot be updated, even as the service role'
);

select * from finish(true);
rollback;
