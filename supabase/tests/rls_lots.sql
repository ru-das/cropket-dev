-- RLS for `lots` (SPEC.md §5.6, §9.2 Phase 1 "1.6", Phase 3 "3.2"). Same
-- select/insert pattern as rls_grade_results.sql, plus 3.2's listing update
-- and 3.2b's buyer-facing read: a farmer can move their own graded draft to
-- listed and nothing else; a buyer sees every listed lot (any farmer's) and
-- no draft at all.
-- Two different failure shapes here, both worth knowing: a USING mismatch
-- (wrong farmer, or the row isn't in 'draft') makes the row invisible to the
-- UPDATE, so it silently touches 0 rows - those checks assert the row is
-- unchanged, the same subtlety rls_buyer_kyc.sql documents. A WITH CHECK
-- mismatch on a row that *did* match USING (an ungraded draft) instead
-- raises an error, same as the missing quantity_kg column grant.
-- Everything here rolls back.
begin;
select plan(15);

insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', '0000000003');

insert into profiles (id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'farmer', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', 'Sunita', 'farmer', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', 'Sharma Traders', 'buyer', '0000000003');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select lives_ok(
  $$ insert into lots (id, farmer_id, crop, quantity_kg, qr_code, location)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
             'onion', 500, 'L-204173', 'SRID=4326;POINT(73.79 20.0)') $$,
  'a farmer can insert their own lot'
);

select throws_ok(
  $$ insert into lots (id, farmer_id, crop, quantity_kg, qr_code)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
             'onion', 500, 'L-999999') $$,
  null, null,
  'inserting a lot for another farmer_id is blocked'
);

-- second farmer's own lot, inserted as the table owner (bypasses RLS) to
-- prove select isolation without needing a second authenticated session.
reset role;
insert into lots (id, farmer_id, crop, quantity_kg, qr_code) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222',
   'onion', 300, 'L-111111');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select is(
  (select count(*)::int from lots),
  1,
  'a farmer selects only their own lots, not the other farmer''s'
);

-- 'aaaaaaaa...' has no grade (inserted above with no grade column). Its
-- status is 'draft', so the USING clause matches (the row is visible for
-- update) - but the resulting row fails `grade is not null` in WITH CHECK,
-- and unlike a USING mismatch, a WITH CHECK failure on a matched row raises
-- an error rather than silently touching 0 rows.
select throws_ok(
  $$ update lots set status = 'listed' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null, null,
  'an ungraded draft cannot be listed'
);

select lives_ok(
  $$ insert into lots (id, farmer_id, crop, quantity_kg, qr_code, grade)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
             'onion', 500, 'L-222222', 'A') $$,
  'a farmer can insert their own graded lot'
);

select lives_ok(
  $$ update lots set status = 'listed' where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' $$,
  'a farmer can list their own graded draft'
);

select is(
  (select status from lots where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'listed',
  'the listed lot really is listed'
);

-- already listed, not draft - USING no longer matches, so this is 0 rows,
-- not an error (there is no "un-list" or "mark sold" grant in 3.2).
update lots set status = 'sold' where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

select is(
  (select status from lots where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'listed',
  'a farmer cannot move their own lot past listed - only draft -> listed is granted'
);

-- 'cccccccc...' belongs to the other farmer - RLS filters it out of the
-- update entirely (it isn't even visible to select), so 0 rows either way.
update lots set status = 'listed' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- reset role to check the real state - farmer 1's own select policy can't
-- see the other farmer's row at all, so checking under their session would
-- just read back null, not prove anything.
reset role;

select is(
  (select status from lots where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'draft',
  'a farmer cannot list another farmer''s lot'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select throws_ok(
  $$ update lots set quantity_kg = 600 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null, null,
  'a farmer cannot update quantity_kg - only status has a column grant'
);

select throws_ok(
  $$ delete from lots where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null, null,
  'a farmer cannot delete their own lot - no grant'
);

select throws_ok(
  $$ insert into lots (id, farmer_id, crop, quantity_kg, qr_code)
     values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
             'onion', 0, 'L-000000') $$,
  null, null,
  'quantity_kg must be > 0'
);

-- 3.2b: a buyer's read of the marketplace. By now only 'eeeeeeee...' is
-- 'listed' - 'aaaaaaaa...' and 'cccccccc...' are both still 'draft'.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","phone":"0000000003","role":"authenticated"}';

select is(
  (select count(*)::int from lots),
  1,
  'a buyer sees only listed lots, from any farmer'
);

select is(
  (select id from lots limit 1),
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'a buyer sees the listed lot, not either draft'
);

-- Niphad-ish coordinates, very different lat/lng so a swap is obvious - the
-- same trap app/tests/unit/domain/geo.test.ts guards on the client side.
-- 'aaaaaaaa...' is a draft, invisible under the buyer's own select policy,
-- so this reads it as the table owner (bypasses RLS) - a generated-column
-- correctness check, not another RLS-isolation check.
reset role;

select is(
  (select (lat, lng) from lots where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  row (20.0::double precision, 73.79::double precision),
  'lots.lat/lng read back latitude then longitude, not swapped'
);

select * from finish(true);
rollback;
