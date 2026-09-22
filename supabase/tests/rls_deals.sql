-- RLS for `deals` (20260923160000_deals.sql, SPEC.md §5.6, §9.2 Phase 3
-- "3.6"). The "every table has RLS on" CI guard already lives in
-- rls_profiles.sql - this file checks grants and select scoping only.
-- accept_bid.sql covers the actual accept-a-bid rules. Rows inserted
-- directly as the table owner (bypasses RLS/accept_bid) since only reads
-- and direct writes are under test here. Everything here rolls back.
begin;
select plan(6);

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
   'onion', 500, 'B', 'L-TESTRD1', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'd3000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001',
  'd1000002-0000-0000-0000-000000000002', 190000, 500,
  950000, 9500, current_date + 2,
  'd1000001-0000-0000-0000-000000000001/x.webm'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"d1000001-0000-0000-0000-000000000001","phone":"0000000051","role":"authenticated"}';

-- 1. the lot's farmer sees the deal
select is(
  (select count(*)::int from deals where id = 'd3000001-0000-0000-0000-000000000001'),
  1,
  'the lot''s farmer sees the deal'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d1000002-0000-0000-0000-000000000002","phone":"0000000052","role":"authenticated"}';

-- 2. the buyer who struck the deal sees it too
select is(
  (select count(*)::int from deals where id = 'd3000001-0000-0000-0000-000000000001'),
  1,
  'the buyer of the deal sees it'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d1000003-0000-0000-0000-000000000003","phone":"0000000053","role":"authenticated"}';

-- 3. a third party (another buyer) sees nothing
select is(
  (select count(*)::int from deals where id = 'd3000001-0000-0000-0000-000000000001'),
  0,
  'a buyer who is not party to the deal sees nothing'
);

-- 4. no insert grant at all - accept_bid (security definer) is the only writer
select throws_ok(
  $$ insert into deals (
       lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
       total_paise, fee_paise, pickup_date, consent_audio_path
     ) values (
       'd2000001-0000-0000-0000-000000000001', auth.uid(), 190000, 500,
       950000, 9500, current_date + 2, 'x/y.webm'
     ) $$,
  null, null,
  'a client cannot insert into deals directly - no grant'
);

-- 5. no update grant at all
select throws_ok(
  $$ update deals set status = 'cancelled' where id = 'd3000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot update a deal - no grant'
);

-- 6. no delete grant
select throws_ok(
  $$ delete from deals where id = 'd3000001-0000-0000-0000-000000000001' $$,
  null, null,
  'a client cannot delete a deal - no grant'
);

select * from finish(true);
rollback;
