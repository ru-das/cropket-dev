-- Tests for the auto-settle pg_cron schedule and admin_delivered_escrows()
-- (SPEC.md §5.2, §5.7, §8.2, §8.6, §9.2 Phase 4 "4.9"). The schedule tests
-- are the same shape as cron_fetch_prices.sql. Everything here rolls back.
begin;
select plan(6);

-- 1. Function trigger_cron_auto_settle() exists
select has_function(
  'public',
  'trigger_cron_auto_settle',
  ARRAY[]::text[],
  'trigger_cron_auto_settle() function exists'
);

-- 2. anon role cannot execute trigger_cron_auto_settle()
select throws_ok(
  $$
    set local role anon;
    select public.trigger_cron_auto_settle();
  $$,
  '42501',
  null,
  'anon cannot execute trigger_cron_auto_settle()'
);

-- Reset role to postgres
reset role;

-- 3. auto-settle job scheduled every 15 minutes and active
select results_eq(
  $$
    select schedule, active
    from cron.job
    where jobname = 'auto-settle';
  $$,
  $$
    values ('*/15 * * * *'::text, true);
  $$,
  'auto-settle job exists with schedule */15 * * * * and is active'
);

-- 4-6. admin_delivered_escrows() (SPEC §5.2, §8.6, §9.2 Phase 4 "4.9")
insert into auth.users (id, phone) values
  ('f6000001-0000-0000-0000-000000000001', '0000000071'),
  ('f6000002-0000-0000-0000-000000000002', '0000000072'),
  ('f6000003-0000-0000-0000-000000000003', '0000000073');

insert into profiles (id, name, role, phone, kyc_status) values
  ('f6000001-0000-0000-0000-000000000001', 'Ramesh', 'farmer', '0000000071', 'pending'),
  ('f6000002-0000-0000-0000-000000000002', 'Sharma Traders', 'buyer', '0000000072', 'verified'),
  ('f6000003-0000-0000-0000-000000000003', 'Admin', 'admin', '0000000073', 'pending');

insert into lots (id, farmer_id, crop, quantity_kg, grade, qr_code, status) values
  ('f7000001-0000-0000-0000-000000000001', 'f6000001-0000-0000-0000-000000000001',
   'onion', 500, 'B', 'L-TESTAS1', 'sold'),
  ('f7000002-0000-0000-0000-000000000002', 'f6000001-0000-0000-0000-000000000001',
   'onion', 300, 'B', 'L-TESTAS2', 'sold');

insert into deals (
  id, lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
  total_paise, fee_paise, pickup_date, consent_audio_path
) values (
  'f8000001-0000-0000-0000-000000000001', 'f7000001-0000-0000-0000-000000000001',
  'f6000002-0000-0000-0000-000000000002', 190000, 500,
  950000, 9500, current_date + 2, 'f6000001-0000-0000-0000-000000000001/x.webm'
), (
  'f8000002-0000-0000-0000-000000000002', 'f7000002-0000-0000-0000-000000000002',
  'f6000002-0000-0000-0000-000000000002', 160000, 300,
  480000, 4800, current_date + 2, 'f6000001-0000-0000-0000-000000000001/y.webm'
);

-- one DELIVERED (should show), one IN_TRANSIT (should not)
insert into escrows (id, deal_id, total_paise, state, auto_release_at) values (
  'f9000001-0000-0000-0000-000000000001', 'f8000001-0000-0000-0000-000000000001',
  959500, 'DELIVERED', now() + interval '24 hours'
), (
  'f9000002-0000-0000-0000-000000000002', 'f8000002-0000-0000-0000-000000000002',
  484800, 'IN_TRANSIT', null
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"f6000003-0000-0000-0000-000000000003","phone":"0000000073","role":"authenticated"}';

-- 4. admin sees the DELIVERED escrow
select results_eq(
  $$
    select escrow_id, qr_code from admin_delivered_escrows()
    where escrow_id = 'f9000001-0000-0000-0000-000000000001'
  $$,
  $$ values ('f9000001-0000-0000-0000-000000000001'::uuid, 'L-TESTAS1'::text) $$,
  'admin_delivered_escrows returns the DELIVERED escrow'
);

-- 5. admin does not see the IN_TRANSIT escrow
select is(
  (select count(*)::int from admin_delivered_escrows()
   where escrow_id = 'f9000002-0000-0000-0000-000000000002'),
  0,
  'admin_delivered_escrows does not return an IN_TRANSIT escrow'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f6000001-0000-0000-0000-000000000001","phone":"0000000071","role":"authenticated"}';

-- 6. a farmer (non-admin) is refused
select throws_ok(
  $$ select admin_delivered_escrows() $$,
  null, 'FORBIDDEN',
  'a farmer cannot call admin_delivered_escrows'
);

reset role;

select * from finish(true);
rollback;
