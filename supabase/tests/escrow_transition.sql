-- Tests for escrow_transition() (20260923170000_escrows.sql, SPEC.md §5.7,
-- §9.2 Phase 4 "4.1"). Verifies: every allowed move in the SPEC §5.7 table
-- works and writes exactly one escrow_events row; an illegal jump throws;
-- a move out of an end state throws; a repeated call to the same state is
-- idempotent (returns the row, writes no new event); DELIVERED sets
-- delivered_at and auto_release_at = delivered_at + 24h; an unknown escrow
-- id throws ESCROW_NOT_FOUND; only the service role may call the function
-- at all. Deals use mega_lot_id (a bare uuid, no FK - same reasoning
-- bids.mega_lot_id/deals.mega_lot_id already document) so no lot is
-- needed. Escrows are inserted directly with the `from_state` each check
-- needs, as the table owner (bypasses RLS/accept_bid) - accept_bid.sql
-- already covers escrow creation. Everything here rolls back.
begin;
select plan(11);

insert into auth.users (id, phone) values
  ('e1000001-0000-0000-0000-000000000001', '0000000061');

insert into profiles (id, name, role, phone, kyc_status) values
  ('e1000001-0000-0000-0000-000000000001', 'Sharma Traders', 'buyer', '0000000061', 'verified');

-- 1. the function exists with the expected signature
select has_function(
  'public', 'escrow_transition', ARRAY['uuid', 'escrow_state', 'text', 'uuid'],
  'escrow_transition(uuid, escrow_state, text, uuid) exists'
);

-- 2-3. only the service role may call it - the app and anon get nothing.
select function_privs_are(
  'public', 'escrow_transition', ARRAY['uuid', 'escrow_state', 'text', 'uuid'],
  'authenticated', ARRAY[]::text[],
  'authenticated has no privilege on escrow_transition'
);
select function_privs_are(
  'public', 'escrow_transition', ARRAY['uuid', 'escrow_state', 'text', 'uuid'],
  'service_role', ARRAY['EXECUTE'],
  'service_role may execute escrow_transition'
);

-- One deal + escrow per row in the SPEC §5.7 table, each escrow starting
-- exactly at that row's from_state.
insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
)
select
  ('e4000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  gen_random_uuid(), 'e1000001-0000-0000-0000-000000000001', 190000, 500,
  950000, 9500, current_date + 2, 'e1000001-0000-0000-0000-000000000001/x.webm'
from generate_series(1, 13) n;

insert into escrows (id, deal_id, total_paise, state)
values
  ('e5000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 959500, 'CREATED'),              -- CREATED -> FUNDED
  ('e5000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000002', 959500, 'CREATED'),              -- CREATED -> CANCELLED
  ('e5000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000003', 959500, 'FUNDED'),               -- FUNDED -> DRIVER_ADVANCE_PAID
  ('e5000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000004', 959500, 'FUNDED'),               -- FUNDED -> IN_TRANSIT
  ('e5000000-0000-0000-0000-000000000005', 'e4000000-0000-0000-0000-000000000005', 959500, 'FUNDED'),               -- FUNDED -> REFUNDED
  ('e5000000-0000-0000-0000-000000000006', 'e4000000-0000-0000-0000-000000000006', 959500, 'DRIVER_ADVANCE_PAID'),  -- DRIVER_ADVANCE_PAID -> IN_TRANSIT
  ('e5000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000007', 959500, 'IN_TRANSIT'),           -- IN_TRANSIT -> DELIVERED
  ('e5000000-0000-0000-0000-000000000008', 'e4000000-0000-0000-0000-000000000008', 959500, 'IN_TRANSIT'),           -- IN_TRANSIT -> DISPUTED
  ('e5000000-0000-0000-0000-000000000009', 'e4000000-0000-0000-0000-000000000009', 959500, 'DELIVERED'),            -- DELIVERED -> RELEASED
  ('e5000000-0000-0000-0000-000000000010', 'e4000000-0000-0000-0000-000000000010', 959500, 'DELIVERED'),            -- DELIVERED -> DISPUTED
  ('e5000000-0000-0000-0000-000000000011', 'e4000000-0000-0000-0000-000000000011', 959500, 'DISPUTED'),             -- DISPUTED -> RELEASED
  ('e5000000-0000-0000-0000-000000000012', 'e4000000-0000-0000-0000-000000000012', 959500, 'DISPUTED'),             -- DISPUTED -> PARTIAL_RELEASED
  ('e5000000-0000-0000-0000-000000000013', 'e4000000-0000-0000-0000-000000000013', 959500, 'DISPUTED');             -- DISPUTED -> REFUNDED

-- 4. every allowed move succeeds and lands in its to_state.
select is(
  (select count(*)::int from (values
    ((escrow_transition('e5000000-0000-0000-0000-000000000001', 'FUNDED', 'test move')).state = 'FUNDED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000002', 'CANCELLED', 'test move')).state = 'CANCELLED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000003', 'DRIVER_ADVANCE_PAID', 'test move')).state = 'DRIVER_ADVANCE_PAID'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000004', 'IN_TRANSIT', 'test move')).state = 'IN_TRANSIT'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000005', 'REFUNDED', 'test move')).state = 'REFUNDED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000006', 'IN_TRANSIT', 'test move')).state = 'IN_TRANSIT'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000007', 'DELIVERED', 'test move')).state = 'DELIVERED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000008', 'DISPUTED', 'test move')).state = 'DISPUTED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000009', 'RELEASED', 'test move')).state = 'RELEASED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000010', 'DISPUTED', 'test move')).state = 'DISPUTED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000011', 'RELEASED', 'test move')).state = 'RELEASED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000012', 'PARTIAL_RELEASED', 'test move')).state = 'PARTIAL_RELEASED'),
    ((escrow_transition('e5000000-0000-0000-0000-000000000013', 'REFUNDED', 'test move')).state = 'REFUNDED')
  ) as t(ok) where ok),
  (select count(*)::int from escrow_transitions),
  'every allowed move in escrow_transitions succeeds and lands in to_state'
);

-- 5. every move above wrote exactly one escrow_events row.
select is(
  (select count(*)::int from escrow_events),
  (select count(*)::int from escrow_transitions),
  'every move wrote exactly one escrow_events row'
);

-- 6. an illegal jump throws.
insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'e2000001-0000-0000-0000-000000000001', gen_random_uuid(),
  'e1000001-0000-0000-0000-000000000001', 190000, 500, 950000, 9500,
  current_date + 2, 'e1000001-0000-0000-0000-000000000001/x.webm'
);
insert into escrows (id, deal_id, total_paise, state) values (
  'e3000001-0000-0000-0000-000000000001', 'e2000001-0000-0000-0000-000000000001',
  959500, 'CREATED'
);
select throws_ok(
  $$ select escrow_transition('e3000001-0000-0000-0000-000000000001', 'RELEASED', 'skip states') $$,
  null, 'ILLEGAL_TRANSITION CREATED -> RELEASED',
  'CREATED -> RELEASED is not an allowed move'
);

-- 7. a move out of an end state throws.
insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'e2000002-0000-0000-0000-000000000002', gen_random_uuid(),
  'e1000001-0000-0000-0000-000000000001', 190000, 500, 950000, 9500,
  current_date + 2, 'e1000001-0000-0000-0000-000000000001/x.webm'
);
insert into escrows (id, deal_id, total_paise, state) values (
  'e3000002-0000-0000-0000-000000000002', 'e2000002-0000-0000-0000-000000000002',
  959500, 'RELEASED'
);
select throws_ok(
  $$ select escrow_transition('e3000002-0000-0000-0000-000000000002', 'REFUNDED', 'too late') $$,
  null, 'ILLEGAL_TRANSITION RELEASED -> REFUNDED',
  'an end state has no way out'
);

-- 8. a repeated call to the same state is idempotent: returns the row,
-- writes no new event.
select escrow_transition('e3000002-0000-0000-0000-000000000002', 'RELEASED', 'repeat');
select is(
  (select count(*)::int from escrow_events where escrow_id = 'e3000002-0000-0000-0000-000000000002'),
  0,
  'repeating the current state writes no new escrow_events row'
);

-- 9. DELIVERED sets delivered_at and auto_release_at = delivered_at + 24h.
insert into deals (
  id, mega_lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'e2000003-0000-0000-0000-000000000003', gen_random_uuid(),
  'e1000001-0000-0000-0000-000000000001', 190000, 500, 950000, 9500,
  current_date + 2, 'e1000001-0000-0000-0000-000000000001/x.webm'
);
insert into escrows (id, deal_id, total_paise, state) values (
  'e3000003-0000-0000-0000-000000000003', 'e2000003-0000-0000-0000-000000000003',
  959500, 'IN_TRANSIT'
);
select escrow_transition('e3000003-0000-0000-0000-000000000003', 'DELIVERED', 'pod uploaded');
select is(
  (select auto_release_at - delivered_at from escrows where id = 'e3000003-0000-0000-0000-000000000003'),
  interval '24 hours',
  'DELIVERED sets auto_release_at to delivered_at + 24 hours'
);

-- 10. an unknown escrow id throws ESCROW_NOT_FOUND.
select throws_ok(
  $$ select escrow_transition(gen_random_uuid(), 'FUNDED', 'nope') $$,
  null, 'ESCROW_NOT_FOUND',
  'an unknown escrow id throws ESCROW_NOT_FOUND'
);

-- 11. authenticated really cannot call it, not just missing a grant on
-- paper - proves the call itself is refused, not just the ACL check above.
set local role authenticated;
set local request.jwt.claims to '{"sub":"e1000001-0000-0000-0000-000000000001","phone":"0000000061","role":"authenticated"}';
select throws_like(
  $$ select escrow_transition('e3000003-0000-0000-0000-000000000003', 'FUNDED', 'nope') $$,
  '%permission denied%',
  'authenticated cannot call escrow_transition directly'
);
reset role;

select * from finish(true);
rollback;
