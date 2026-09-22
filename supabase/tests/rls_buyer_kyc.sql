-- RLS for `buyer_kyc` (SPEC.md §5.6, §9.2 Phase 3 "3.1"). Only `kyc-verify`
-- (service role) ever inserts - `authenticated` has select-your-own plus a
-- narrow update(status) grant gated to admins only, so this test proves:
-- a buyer sees only their own row and cannot insert or self-verify; an
-- admin sees every row and an admin's approve/reject writes through the
-- buyer_kyc_sync trigger into profiles.kyc_status. Everything here rolls back.
begin;
select plan(7);

-- three fake auth users: two buyers, one admin. Dummy phones, same pattern
-- as rls_profiles.sql / rls_grade_results.sql.
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', '0000000003');
insert into profiles (id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Sharma Traders', 'buyer', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', 'Patil Agro', 'buyer', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', 'Admin', 'admin', '0000000003');

-- inserted as the table owner (bypasses RLS) - stands in for kyc-verify's
-- service role, which is what actually writes these rows.
insert into buyer_kyc (buyer_id, business_name, gst_number, pan_last4, status, source) values
  ('11111111-1111-1111-1111-111111111111', 'Sharma Traders', '27ABCDE1234F1Z5', '1234', 'pending', 'mock'),
  ('22222222-2222-2222-2222-222222222222', 'Patil Agro', '27ZZZZZ9999Z1Z5', '9999', 'pending', 'mock');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select is(
  (select count(*)::int from buyer_kyc),
  1,
  'a buyer selects only their own buyer_kyc row, not the other buyer''s'
);

select throws_ok(
  $$ insert into buyer_kyc (buyer_id, business_name, gst_number, pan_last4, status, source)
     values ('11111111-1111-1111-1111-111111111111', 'Sharma Traders', '27ABCDE1234F1Z5', '1234', 'pending', 'mock') $$,
  null, null,
  'a buyer cannot insert a buyer_kyc row - only kyc-verify (service role) can'
);

-- The update(status) column grant lets these statements run at all, but the
-- USING clause of buyer_kyc_update_admin filters the row out for a
-- non-admin - so each silently updates 0 rows rather than throwing (unlike
-- a missing column grant, which does throw - see rls_profiles.sql). Run as
-- plain top-level statements (a data-modifying WITH can't be a select
-- argument), then check the row is unchanged.
update buyer_kyc set status = 'verified' where buyer_id = '11111111-1111-1111-1111-111111111111';
update buyer_kyc set status = 'verified' where buyer_id = '22222222-2222-2222-2222-222222222222';

reset role;

select is(
  (select status from buyer_kyc where buyer_id = '11111111-1111-1111-1111-111111111111'),
  'pending',
  'a buyer cannot self-verify - the update policy only admits role = admin'
);

select is(
  (select status from buyer_kyc where buyer_id = '22222222-2222-2222-2222-222222222222'),
  'pending',
  'a buyer cannot touch another buyer''s buyer_kyc row either'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","phone":"0000000003","role":"authenticated"}';

select is(
  (select count(*)::int from buyer_kyc),
  2,
  'an admin selects every buyer_kyc row'
);

select lives_ok(
  $$ update buyer_kyc set status = 'verified' where buyer_id = '11111111-1111-1111-1111-111111111111' $$,
  'an admin can approve a pending buyer_kyc row'
);

reset role;

select results_eq(
  $$ select p.kyc_status, (b.verified_at is not null)
     from profiles p join buyer_kyc b on b.buyer_id = p.id
     where p.id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('verified'::text, true) $$,
  'the buyer_kyc_sync trigger mirrors the approval into profiles.kyc_status and sets buyer_kyc.verified_at'
);

select * from finish(true);
rollback;
