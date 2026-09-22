-- RLS for the `crop-photos` bucket (SPEC.md §5.1, §7.4, §9.2 Phase 3
-- "3.2b"). 3.2b adds one more select policy: a buyer can read an object
-- that's named in a listed lot's grade_results.photo_paths - the bucket's
-- original comment said "buyers never get a policy here", which this change
-- narrows rather than reverses (a draft's photos stay exactly as private).
-- Everything created here rolls back at the end - nothing is left in
-- cropket-dev.
begin;
select plan(7);

select is(
  (select public from storage.buckets where id = 'crop-photos'),
  false,
  'crop-photos bucket exists and is private'
);

-- two fake auth users, same pattern as rls_profiles.sql - clearly-dummy
-- phone values, never a real test number.
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '0000000001'),
  ('22222222-2222-2222-2222-222222222222', '0000000002');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('crop-photos', '11111111-1111-1111-1111-111111111111/photo-1.jpg',
             '11111111-1111-1111-1111-111111111111') $$,
  'a user can insert an object under their own uid folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('crop-photos', '22222222-2222-2222-2222-222222222222/photo-1.jpg',
             '11111111-1111-1111-1111-111111111111') $$,
  null, null,
  'inserting into another uid''s folder is blocked'
);

-- second user, as its own session, to prove select isolation.
reset role;
insert into storage.objects (bucket_id, name, owner)
values ('crop-photos', '22222222-2222-2222-2222-222222222222/photo-1.jpg',
        '22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","phone":"0000000001","role":"authenticated"}';

select is(
  (select count(*)::int from storage.objects where bucket_id = 'crop-photos'),
  1,
  'a farmer sees only their own object, not the other user''s'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('crop-photos', '11111111-1111-1111-1111-111111111111/photo-1.jpg',
             '11111111-1111-1111-1111-111111111111')
     on conflict (bucket_id, name) do update set owner = excluded.owner $$,
  'a retry (upsert) of an object already owned by the same user works'
);

-- one grade + one listed lot pointing at user 1's photo, plus a buyer -
-- proves a listed lot's photo becomes readable, and an unlisted photo
-- (user 2's) does not.
reset role;
insert into auth.users (id, phone) values ('33333333-3333-3333-3333-333333333333', '0000000003');
insert into profiles (id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'farmer', '0000000001'),
  ('33333333-3333-3333-3333-333333333333', 'Sharma Traders', 'buyer', '0000000003');
insert into grade_results (id, farmer_id, crop, photo_paths) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'onion',
   array['11111111-1111-1111-1111-111111111111/photo-1.jpg']);
insert into lots (id, farmer_id, crop, quantity_kg, qr_code, grade, grade_result_id, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'onion', 500, 'L-333333', 'A', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'listed');

set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","phone":"0000000003","role":"authenticated"}';

select is(
  (select count(*)::int from storage.objects where bucket_id = 'crop-photos'),
  1,
  'a buyer sees only the photo of a listed lot, not the other user''s unlisted one'
);

select is(
  (select name from storage.objects where bucket_id = 'crop-photos' limit 1),
  '11111111-1111-1111-1111-111111111111/photo-1.jpg',
  'the visible object is the listed lot''s own photo'
);

select * from finish(true);
rollback;
