-- RLS for the `crop-photos` bucket (SPEC.md §5.1, §7.4). Everything created
-- here rolls back at the end - nothing is left in cropket-dev.
begin;
select plan(5);

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

select * from finish(true);
rollback;
