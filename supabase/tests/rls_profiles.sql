-- RLS for `profiles` (SPEC.md §5.6, CLAUDE.md §6). Everything created here
-- rolls back at the end - nothing is left in cropket-dev.
begin;
select plan(12);

-- every table in public must have RLS on (CLAUDE.md §6 CI guard - one row
-- today, grows on its own as new tables are added in later migrations).
select is_empty(
  $$ select relname from pg_class
     join pg_namespace on pg_namespace.oid = pg_class.relnamespace
     where pg_namespace.nspname = 'public' and pg_class.relkind = 'r' and not pg_class.relrowsecurity $$,
  'every table in public has RLS on'
);

-- two fake auth users so real FKs (profiles.id -> auth.users.id) are satisfied.
-- Clearly-dummy phone values, on purpose - never one of the real test
-- numbers configured on cropket-dev (auth.users.phone is globally unique,
-- and those numbers get real rows the moment someone logs in with them).
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

-- a user can create their own profile, but never pick admin/nbfc for themselves.
-- Includes village, crops and a GPS point (1.1 chat-style onboarding), the
-- same columns createMyProfile() writes.
select lives_ok(
  $$ insert into profiles (id, name, role, village, crops, location)
     values ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'farmer', 'Niphad',
             array['onion'], 'SRID=4326;POINT(73.79 20.0)') $$,
  'insert own row as farmer, with village, crops and a GPS point, works'
);

-- longitude-before-latitude (geo.ts toPointWKT) really lands as that point,
-- not swapped.
select is(
  (select st_astext(location::geometry) from profiles where id = '11111111-1111-1111-1111-111111111111'),
  'POINT(73.79 20)',
  'the GPS point is stored longitude-first, as sent'
);

-- district/state are not sent by the app (SPEC.md §2.4 floor price needs a
-- district even before reverse geocoding exists) - the column default fills
-- them with the pilot area.
select is(
  (select district from profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Nashik',
  'district defaults to the pilot area (Nashik) when not given'
);

select throws_ok(
  $$ insert into profiles (id, name, role) values ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'admin') $$,
  null, null,
  'insert own row as admin is blocked by the insert policy'
);

select throws_ok(
  $$ insert into profiles (id, name, role) values ('22222222-2222-2222-2222-222222222222', 'Other', 'farmer') $$,
  null, null,
  'insert a row for another user id is blocked'
);

-- second user, as its own session, to prove select isolation.
reset role;
insert into profiles (id, name, role) values ('22222222-2222-2222-2222-222222222222', 'Sunita', 'buyer');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select is(
  (select count(*)::int from profiles),
  1,
  'a farmer selects only their own profile, not the other user''s'
);

select throws_ok(
  $$ update profiles set role = 'admin' where id = auth.uid() $$,
  null, null,
  'updating own role is blocked - no column grant'
);

select throws_ok(
  $$ update profiles set banned = true where id = auth.uid() $$,
  null, null,
  'updating own banned flag is blocked - no column grant'
);

select lives_ok(
  $$ update profiles set name = 'Ramesh K' where id = auth.uid() $$,
  'updating own name works'
);

-- crops is checked against the known list (profiles_crops_known), same as
-- role/banned above are checked against their column grants.
select throws_ok(
  $$ update profiles set crops = array['wheat'] where id = auth.uid() $$,
  null, null,
  'updating crops to an unknown value is blocked by the check constraint'
);

-- village, crops and location stay editable even though role/banned/etc.
-- (checked above) are not - onboarding's fields are the ones a farmer is
-- meant to keep able to change.
select lives_ok(
  $$ update profiles set village = 'Lasalgaon', crops = array['onion', 'tomato'],
       location = 'SRID=4326;POINT(74.24 20.15)' where id = auth.uid() $$,
  'updating own village, crops and location works'
);

select * from finish(true);
rollback;
