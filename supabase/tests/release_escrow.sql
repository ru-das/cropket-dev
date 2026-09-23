-- Tests for release_escrow() (20260923230000_release_escrow.sql, SPEC.md
-- §5.3, §5.7, §9.2 Phase 4 "4.8"). Verifies: the happy path moves
-- DELIVERED -> RELEASED, writes one escrow_events row carrying the reason,
-- two payouts rows (farmer_share + platform_fee) summing to the escrow
-- total exactly, and one green khata_entries row for the farmer at the
-- farmer_share amount; a repeat call is idempotent (no second event,
-- payout or Khata row); IN_TRANSIT and DISPUTED escrows are both refused
-- with ESCROW_WRONG_STATE (the second is the "timer must not release a
-- disputed escrow" case, SPEC §5.7); a payout total that doesn't match the
-- escrow total is refused (SPLIT_MISMATCH) and writes nothing; an unknown
-- id throws ESCROW_NOT_FOUND; only the service role may call it; a
-- farmer_share payout with a null to_user violates the table's own check
-- constraint. Deals/escrows are inserted directly as the table owner
-- (bypasses RLS/accept_bid/fund_escrow/record_pod) - those are covered by
-- their own test files. Everything here rolls back.
begin;
select plan(15);

insert into auth.users (id, phone) values
  ('a1000001-0000-0000-0000-000000000001', '0000000071'),
  ('a1000002-0000-0000-0000-000000000002', '0000000072');

insert into profiles (id, name, role, phone, kyc_status) values
  ('a1000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000071', 'pending'),
  ('a1000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000072', 'verified');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('a2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTRE1', 'sold'),
  ('a2000002-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTRE2', 'sold'),
  ('a2000003-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000001',
   'onion', 200, 'B', 'L-TESTRE3', 'sold'),
  ('a2000004-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000001',
   'onion', 100, 'B', 'L-TESTRE4', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'a3000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001',
  'a1000002-0000-0000-0000-000000000002', 190000, 500,
  950000, 9500, current_date + 2, 'a1000001-0000-0000-0000-000000000001/a.webm'
), (
  'a3000002-0000-0000-0000-000000000002', 'a2000002-0000-0000-0000-000000000002',
  'a1000002-0000-0000-0000-000000000002', 160000, 300,
  480000, 4800, current_date + 2, 'a1000001-0000-0000-0000-000000000001/b.webm'
), (
  'a3000003-0000-0000-0000-000000000003', 'a2000003-0000-0000-0000-000000000003',
  'a1000002-0000-0000-0000-000000000002', 170000, 200,
  340000, 3400, current_date + 2, 'a1000001-0000-0000-0000-000000000001/c.webm'
), (
  'a3000004-0000-0000-0000-000000000004', 'a2000004-0000-0000-0000-000000000004',
  'a1000002-0000-0000-0000-000000000002', 180000, 100,
  180000, 1800, current_date + 2, 'a1000001-0000-0000-0000-000000000001/d.webm'
);

insert into escrows (id, deal_id, total_paise, state) values (
  'a4000001-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000001',
  959500, 'DELIVERED'
), (
  'a4000002-0000-0000-0000-000000000002', 'a3000002-0000-0000-0000-000000000002',
  484800, 'IN_TRANSIT'
), (
  'a4000003-0000-0000-0000-000000000003', 'a3000003-0000-0000-0000-000000000003',
  343400, 'DISPUTED'
), (
  'a4000004-0000-0000-0000-000000000004', 'a3000004-0000-0000-0000-000000000004',
  181800, 'DELIVERED'
);

-- 1. the function exists with the expected signature
select has_function(
  'public', 'release_escrow', ARRAY['uuid', 'text', 'jsonb', 'text'],
  'release_escrow(uuid, text, jsonb, text) exists'
);

-- 2-3. only the service role may call it
select function_privs_are(
  'public', 'release_escrow', ARRAY['uuid', 'text', 'jsonb', 'text'],
  'authenticated', ARRAY[]::text[],
  'authenticated has no privilege on release_escrow'
);
select function_privs_are(
  'public', 'release_escrow', ARRAY['uuid', 'text', 'jsonb', 'text'],
  'service_role', ARRAY['EXECUTE'],
  'service_role may execute release_escrow'
);

-- 4. an unknown escrow id throws ESCROW_NOT_FOUND
select throws_ok(
  $$ select release_escrow(gen_random_uuid(), 'otp', '[]'::jsonb, 'mock_x') $$,
  null, 'ESCROW_NOT_FOUND',
  'an unknown escrow id throws ESCROW_NOT_FOUND'
);

-- 5. an IN_TRANSIT escrow is refused
select throws_ok(
  $$ select release_escrow('a4000002-0000-0000-0000-000000000002', 'otp',
       '[{"type":"farmer_share","farmerId":"a1000001-0000-0000-0000-000000000001","amountPaise":475200},
         {"type":"platform_fee","amountPaise":9600}]'::jsonb, 'mock_x') $$,
  null, 'ESCROW_WRONG_STATE',
  'an IN_TRANSIT escrow cannot be released'
);

-- 6. a DISPUTED escrow is refused - the 24h timer must never release a
-- deal with an open dispute (SPEC §5.7's own test requirement)
select throws_ok(
  $$ select release_escrow('a4000003-0000-0000-0000-000000000003', 'auto_release',
       '[{"type":"farmer_share","farmerId":"a1000001-0000-0000-0000-000000000001","amountPaise":336600},
         {"type":"platform_fee","amountPaise":6800}]'::jsonb, 'mock_x') $$,
  null, 'ESCROW_WRONG_STATE',
  'a DISPUTED escrow cannot be released'
);

-- 7. a payout total that doesn't match the escrow total is refused, and
-- writes nothing (fail closed)
select throws_ok(
  $$ select release_escrow('a4000004-0000-0000-0000-000000000004', 'otp',
       '[{"type":"farmer_share","farmerId":"a1000001-0000-0000-0000-000000000001","amountPaise":1}]'::jsonb,
       'mock_x') $$,
  null, 'SPLIT_MISMATCH',
  'a payout total that does not match the escrow total is refused'
);
select is(
  (select state::text from escrows where id = 'a4000004-0000-0000-0000-000000000004'),
  'DELIVERED',
  'a SPLIT_MISMATCH call leaves the escrow untouched'
);

-- The happy-path call is its own statement (same MVCC reasoning
-- accept_bid.sql/fund_escrow.sql document) so the later reads see its
-- writes.
select release_escrow(
  'a4000001-0000-0000-0000-000000000001', 'otp',
  '[{"type":"farmer_share","farmerId":"a1000001-0000-0000-0000-000000000001","amountPaise":950000},
    {"type":"platform_fee","amountPaise":9500}]'::jsonb,
  'mock_order-1'
);

-- 8. the escrow moved to RELEASED
select is(
  (select state::text from escrows where id = 'a4000001-0000-0000-0000-000000000001'),
  'RELEASED',
  'release_escrow moves the escrow from DELIVERED to RELEASED'
);

-- 9. exactly one escrow_events row carrying the reason
select is(
  (select count(*)::int from escrow_events
   where escrow_id = 'a4000001-0000-0000-0000-000000000001'
     and from_state = 'DELIVERED' and to_state = 'RELEASED' and reason = 'otp'),
  1,
  'release_escrow writes one DELIVERED -> RELEASED event with the reason'
);

-- 10. two payouts rows summing to the escrow total exactly - the farmer
-- share is credited to the farmer, the platform fee has no to_user at all
-- (the platform has no profiles row)
select results_eq(
  $$ select to_user, amount_paise, type, status, provider_ref
     from payouts where escrow_id = 'a4000001-0000-0000-0000-000000000001'
     order by type $$,
  $$ values
       ('a1000001-0000-0000-0000-000000000001'::uuid, 950000::bigint, 'farmer_share', 'paid', 'mock_order-1'),
       (null::uuid, 9500::bigint, 'platform_fee', 'paid', 'mock_order-1') $$,
  'release_escrow writes a farmer_share payout to the farmer and a platform_fee payout with no to_user'
);

-- 11. one green Khata row for the farmer at the farmer_share amount (not
-- the bigger escrow total, which also holds the platform fee)
select results_eq(
  $$ select amount_paise, colour::text, title_key
     from khata_entries where deal_id = 'a3000001-0000-0000-0000-000000000001' and colour = 'green' $$,
  $$ values (950000::bigint, 'green', 'khata.received') $$,
  'release_escrow writes one green Khata row for the farmer, at the farmer_share amount'
);

-- 12-13. a repeat call is idempotent - no second event, payout or Khata row
select release_escrow(
  'a4000001-0000-0000-0000-000000000001', 'otp',
  '[{"type":"farmer_share","farmerId":"a1000001-0000-0000-0000-000000000001","amountPaise":950000},
    {"type":"platform_fee","amountPaise":9500}]'::jsonb,
  'mock_order-1-retry'
);
select is(
  (select count(*)::int from escrow_events where escrow_id = 'a4000001-0000-0000-0000-000000000001'),
  1,
  'a repeated release_escrow call writes no second event'
);
select is(
  (select count(*)::int from payouts where escrow_id = 'a4000001-0000-0000-0000-000000000001'),
  2,
  'a repeated release_escrow call writes no extra payout rows'
);

-- 14. a farmer_share payout with a null to_user violates the table's own
-- check constraint - this is the last line of defence if release.ts (the
-- TypeScript caller) ever builds a line wrong.
select throws_like(
  $$ insert into payouts (escrow_id, to_user, amount_paise, type, status)
     values ('a4000001-0000-0000-0000-000000000001', null, 1, 'farmer_share', 'paid') $$,
  '%payouts_to_user_required%',
  'a farmer_share payout with no to_user violates the check constraint'
);

select * from finish(true);
rollback;
