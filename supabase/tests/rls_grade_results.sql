-- RLS for `grade_results` (SPEC.md §5.6, §5.4, §9.2 Phase 3 "3.2b"). Only
-- the `grade` Edge Function (service role) ever writes this table -
-- `authenticated` has select-only, so this test proves select-your-own plus
-- that insert/update are both rejected for a logged-in farmer. 3.2b adds a
-- second select policy: a buyer can read the grade_results row of a lot
-- that is actually `listed` (so the marketplace can show a real photo/grade)
-- and nothing else. Everything here rolls back.
begin;
select plan(6);

-- three fake auth users + profiles, same pattern as rls_profiles.sql.
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', '0000000003');
-- phone given explicitly, unlike rls_profiles.sql's insert-as-authenticated
-- rows - here we insert as the table owner (standing in for the grade
-- function's service role), which bypasses the `default (auth.jwt()...)`
-- context that only exists inside an authenticated request.
insert into profiles (id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'farmer', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', 'Sunita', 'farmer', '0000000002'),
  ('33333333-3333-3333-3333-333333333333', 'Sharma Traders', 'buyer', '0000000003');

-- inserted as the table owner (bypasses RLS) - stands in for the service
-- role, which is what the `grade` function actually uses to write these rows.
insert into grade_results (id, farmer_id, crop, photo_paths) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'onion', array['11111111-1111-1111-1111-111111111111/p1.jpg']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'onion', array['22222222-2222-2222-2222-222222222222/p1.jpg']);

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select is(
  (select count(*)::int from grade_results),
  1,
  'a farmer selects only their own grade_results row, not the other user''s'
);

select is(
  (select status from grade_results where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'pending',
  'the visible row is the farmer''s own'
);

select throws_ok(
  $$ insert into grade_results (id, farmer_id, crop, photo_paths)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
             'onion', array['x.jpg']) $$,
  null, null,
  'a farmer cannot insert a grade_results row - only the grade function (service role) can'
);

select throws_ok(
  $$ update grade_results set status = 'done' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null, null,
  'a farmer cannot update their own grade_results row - no column grant'
);

-- one lot lists farmer 1's grade result, farmer 2's stays undiscoverable.
reset role;
insert into lots (id, farmer_id, crop, quantity_kg, qr_code, grade, grade_result_id, status) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
   'onion', 500, 'L-333333', 'A', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'listed');

set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","phone":"0000000003","role":"authenticated"}';

select is(
  (select count(*)::int from grade_results),
  1,
  'a buyer sees only the grade_results row of a listed lot'
);

select is(
  (select id from grade_results limit 1),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'the visible row is the listed lot''s grade, not the other farmer''s undiscoverable one'
);

select * from finish(true);
rollback;
