-- RLS for `lots` (SPEC.md §5.6, §9.2 Phase 1 "1.6"). Same pattern as
-- rls_grade_results.sql: a farmer's own rows only, insert-your-own, and no
-- update/delete at all yet (no column grant - see the migration's comment).
-- Everything here rolls back.
begin;
select plan(6);

insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002');

insert into profiles (id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'farmer', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', 'Sunita', 'farmer', '0000000002');

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

select throws_ok(
  $$ update lots set quantity_kg = 600 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null, null,
  'a farmer cannot update their own lot - no column grant yet'
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

select * from finish(true);
rollback;
