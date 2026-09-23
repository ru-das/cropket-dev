-- Tests for record_otp_attempt() (20260923200000_delivery_otp.sql,
-- SPEC.md §5.2, §5.7, §9.2 Phase 4 "4.5"). Verifies: a wrong try counts
-- down tries-left and locks at 5; a correct try on a fresh escrow reports
-- 5 left without changing otp_tries; a locked escrow refuses even a
-- correct guess; a non-DELIVERED escrow is refused; an unknown id throws
-- ESCROW_NOT_FOUND; only the service role may call it; no attempt writes
-- an escrow_events row (it never changes escrow state). Deals use
-- mega_lot_id (bare uuid, no FK) so no lot is needed, same as
-- escrow_transition.sql. Everything here rolls back.
begin;
select plan(12);

insert into auth.users (id, phone) values
  ('f1000001-0000-0000-0000-000000000001', '0000000071');

insert into profiles (id, name, role, phone, kyc_status) values
  ('f1000001-0000-0000-0000-000000000001', 'Sharma Traders', 'buyer', '0000000071', 'verified');

-- 1. the function exists with the expected signature
select has_function(
  'public', 'record_otp_attempt', ARRAY['uuid', 'boolean'],
  'record_otp_attempt(uuid, boolean) exists'
);

-- 2-3. only the service role may call it
select function_privs_are(
  'public', 'record_otp_attempt', ARRAY['uuid', 'boolean'],
  'authenticated', ARRAY[]::text[],
  'authenticated has no privilege on record_otp_attempt'
);
select function_privs_are(
  'public', 'record_otp_attempt', ARRAY['uuid', 'boolean'],
  'service_role', ARRAY['EXECUTE'],
  'service_role may execute record_otp_attempt'
);

insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'f2000001-0000-0000-0000-000000000001', gen_random_uuid(),
  'f1000001-0000-0000-0000-000000000001', 190000, 500, 950000, 9500,
  current_date + 2, 'f1000001-0000-0000-0000-000000000001/x.webm'
);
insert into escrows (id, deal_id, total_paise, state) values (
  'f3000001-0000-0000-0000-000000000001', 'f2000001-0000-0000-0000-000000000001',
  959500, 'DELIVERED'
);

-- 4. a correct try on a fresh escrow reports 5 left and changes nothing
select is(
  record_otp_attempt('f3000001-0000-0000-0000-000000000001', true), 5,
  'a correct guess on a fresh escrow reports 5 tries left'
);
select is(
  (select otp_tries::int from escrows where id = 'f3000001-0000-0000-0000-000000000001'), 0,
  'a correct guess does not change otp_tries'
);

-- 5. a wrong try counts down and is persisted
select is(
  record_otp_attempt('f3000001-0000-0000-0000-000000000001', false), 4,
  'the first wrong guess leaves 4 tries'
);
select is(
  (select otp_tries::int from escrows where id = 'f3000001-0000-0000-0000-000000000001'), 1,
  'the wrong guess is persisted on the row'
);

-- 6. 5 wrong tries total locks the escrow, and the 6th call (even correct)
-- throws OTP_LOCKED instead of returning a count.
select record_otp_attempt('f3000001-0000-0000-0000-000000000001', false); -- 2
select record_otp_attempt('f3000001-0000-0000-0000-000000000001', false); -- 3
select record_otp_attempt('f3000001-0000-0000-0000-000000000001', false); -- 4
select is(
  record_otp_attempt('f3000001-0000-0000-0000-000000000001', false), 0,
  'the 5th wrong guess reports 0 tries left'
);
select throws_ok(
  $$ select record_otp_attempt('f3000001-0000-0000-0000-000000000001', true) $$,
  null, 'OTP_LOCKED',
  'a 6th attempt, even a correct one, is refused once locked'
);

-- 7. a non-DELIVERED escrow is refused
insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'f2000002-0000-0000-0000-000000000002', gen_random_uuid(),
  'f1000001-0000-0000-0000-000000000001', 190000, 500, 950000, 9500,
  current_date + 2, 'f1000001-0000-0000-0000-000000000001/x.webm'
);
insert into escrows (id, deal_id, total_paise, state) values (
  'f3000002-0000-0000-0000-000000000002', 'f2000002-0000-0000-0000-000000000002',
  959500, 'IN_TRANSIT'
);
select throws_ok(
  $$ select record_otp_attempt('f3000002-0000-0000-0000-000000000002', true) $$,
  null, 'ESCROW_WRONG_STATE',
  'an escrow not yet DELIVERED refuses an OTP attempt'
);

-- 8. an unknown escrow id throws ESCROW_NOT_FOUND
select throws_ok(
  $$ select record_otp_attempt(gen_random_uuid(), true) $$,
  null, 'ESCROW_NOT_FOUND',
  'an unknown escrow id throws ESCROW_NOT_FOUND'
);

-- 9. no attempt ever writes an escrow_events row - it never changes state
select is(
  (select count(*)::int from escrow_events
   where escrow_id in ('f3000001-0000-0000-0000-000000000001', 'f3000002-0000-0000-0000-000000000002')),
  0,
  'record_otp_attempt writes no escrow_events row'
);

select * from finish(true);
rollback;
