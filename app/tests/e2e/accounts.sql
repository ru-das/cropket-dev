-- Gets the e2e test farmer (9090910010) and buyer (9090920001) into a known,
-- ready state before every run of core-flow.spec.ts (AGENTS.md §6 "5.2").
-- Idempotent (on conflict do update), same shape supabase/demo-data.sql
-- already uses for `profiles` - safe to run before every test, not just once.
-- global-setup.ts runs this with psql -1 after creating the farmer's
-- auth.users row (the buyer's already exists, created by hand for 3.x's own
-- testing).
insert into profiles (id, name, role, phone, village, district, state, crops, location, language)
select
  u.id, 'E2E Farmer', 'farmer', u.phone, 'Niphad', 'Nashik', 'Maharashtra', '{onion}',
  'SRID=4326;POINT(74.1116 20.0847)'::geography, 'en'
from auth.users u
where u.phone = '9090910010'
on conflict (id) do update set
  role = excluded.role, crops = excluded.crops, village = excluded.village,
  district = excluded.district, state = excluded.state, location = excluded.location,
  language = excluded.language;

-- The buyer already has a profile (role picked by hand in 3.x testing) -
-- only English + verified KYC need forcing here.
update profiles set language = 'en'
where phone = '9090920001';

insert into buyer_kyc (buyer_id, business_name, gst_number, pan_last4, status, source, verified_at)
select p.id, 'E2E Buyer Co', '27AAAAA0000A1Z5', 'ZZZZ', 'verified', 'mock', now()
from profiles p
where p.phone = '9090920001'
on conflict (buyer_id) do update set
  status = 'verified', verified_at = now();
