-- Demo people + demo marketplace for cropket-dev (SPEC.md §8.6, §9.2 "5.1",
-- only the M0-M4 parts - no cold storages (Phase 5) and no "lien found"
-- farmer (Phase 7), neither has a table yet). Run by hand or via
-- `scripts/demo-reset.ts`, which calls this file straight after
-- `seed.sql` - psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -f
-- supabase/demo-data.sql - as the table owner, so it bypasses RLS.
--
-- The 18 demo people use phones 9090950001-9090950018, a range of their
-- own that never overlaps the team's own dev-login numbers (9090910001...,
-- CLAUDE.md §7). `scripts/demo-reset.ts` creates their `auth.users` rows
-- first (this file only writes `public.*` - it cannot create an
-- `auth.users` row itself, that needs the Admin API, not SQL a farmer's
-- role could ever run). Add these 4 as Supabase dashboard test numbers
-- (Auth -> Phone -> test OTPs) once: 9090950001=950001 (farmer),
-- 9090950013=950013 (buyer), 9090950017=950017 (fpo), 9090950018=950018
-- (admin) - the other 14 demo people are seeded data, nobody logs in as them.
--
-- Idempotent by wipe-then-insert, not `on conflict do nothing`: every lot,
-- grade_result, bid, mega lot and (any leftover from a practice run) deal /
-- escrow / shipment / khata row a demo person owns is deleted first, then
-- the known-good state is inserted fresh - so running this file again after
-- a live demo run always returns to the same starting point (CLAUDE.md §2
-- "seed data must be safe to run twice"). `profiles` and `buyer_kyc` are
-- upserted instead of wiped, because `auth.users` rows (and any real
-- session on a demo phone) must never be deleted by a reset.
--
-- No `begin`/`commit` here on purpose: the wipe-then-insert must run as one
-- transaction, but a `commit` inside a file that's `\ir`-included from a
-- pgTAP test (which always opens its own `begin` first) would commit that
-- outer transaction too - `commit` doesn't nest in Postgres, it just ends
-- whatever transaction is already open (confirmed the hard way: a first
-- draft with `begin`/`commit` here silently committed test rows straight
-- into cropket-dev instead of rolling back). `scripts/demo-reset.ts` runs
-- this file with `psql -1` (single-transaction mode) instead, so a
-- standalone run is still atomic.
-- `drop ... if exists` first, not just `on commit drop`, so this file can
-- also run twice back to back inside one already-open transaction (the SQL
-- test below does exactly that) without a "relation already exists" error.
drop table if exists demo_people, demo_deal_ids, demo_mega_lot_ids;

create temporary table demo_people (
  id uuid primary key,
  phone text not null,
  role user_role not null,
  name text not null,
  village text,
  crops text[] not null default '{}',
  lng double precision,
  lat double precision
) on commit drop;

insert into demo_people (id, phone, role, name, village, crops, lng, lat) values
  -- Farmers (12) - the demo farmer (01) starts with zero lots, they're
  -- scanned live during the demo. 02-05 own the four small onion lots
  -- that the real group_mega_lots trigger below bundles into one 500 kg
  -- mega lot. 06-09 each own one bigger single lot. 10-12 are background
  -- names only (SPEC §8.6 "12 farmers"), no lot.
  ('30000001-0000-0000-0000-000000000001', '9090950001', 'farmer', 'Ramesh Patil', 'Niphad', '{onion}', 74.1116, 20.0847),
  ('30000001-0000-0000-0000-000000000002', '9090950002', 'farmer', 'Suresh Jadhav', 'Niphad', '{onion}', 74.1150, 20.0860),
  ('30000001-0000-0000-0000-000000000003', '9090950003', 'farmer', 'Vitthal More', 'Niphad', '{onion}', 74.1080, 20.0830),
  ('30000001-0000-0000-0000-000000000004', '9090950004', 'farmer', 'Ganesh Pawar', 'Niphad', '{onion}', 74.1200, 20.0900),
  ('30000001-0000-0000-0000-000000000005', '9090950005', 'farmer', 'Anita Shinde', 'Niphad', '{onion}', 74.1050, 20.0790),
  ('30000001-0000-0000-0000-000000000006', '9090950006', 'farmer', 'Baban Gaikwad', 'Lasalgaon', '{onion}', 74.2340, 20.1462),
  ('30000001-0000-0000-0000-000000000007', '9090950007', 'farmer', 'Sunita Wagh', 'Pimpalgaon Baswant', '{onion}', 73.9998, 20.1725),
  ('30000001-0000-0000-0000-000000000008', '9090950008', 'farmer', 'Dilip Kale', 'Yeola', '{potato}', 74.4864, 20.0433),
  ('30000001-0000-0000-0000-000000000009', '9090950009', 'farmer', 'Meera Bhosale', 'Chandvad', '{tomato}', 74.2333, 20.3333),
  ('30000001-0000-0000-0000-000000000010', '9090950010', 'farmer', 'Ashok Deshmukh', 'Lasalgaon', '{onion}', null, null),
  ('30000001-0000-0000-0000-000000000011', '9090950011', 'farmer', 'Kavita Salunkhe', 'Pimpalgaon Baswant', '{onion}', null, null),
  ('30000001-0000-0000-0000-000000000012', '9090950012', 'farmer', 'Ramdas Chavan', 'Niphad', '{onion}', null, null),
  -- Buyers (4): 13 is the one who logs in during the demo, 14-15 are the
  -- verified competing bidders on lot 06, 16 is the "1 unverified" (SPEC
  -- §8.6) - kyc_status is set below from a `pending` buyer_kyc row, so the
  -- admin approve screen has something real to click during the demo.
  ('30000001-0000-0000-0000-000000000013', '9090950013', 'buyer', 'Sharma Traders', null, '{}', null, null),
  ('30000001-0000-0000-0000-000000000014', '9090950014', 'buyer', 'Patil Agro Exports', null, '{}', null, null),
  ('30000001-0000-0000-0000-000000000015', '9090950015', 'buyer', 'Nashik Fresh Produce', null, '{}', null, null),
  ('30000001-0000-0000-0000-000000000016', '9090950016', 'buyer', 'Om Trading Co', null, '{}', null, null),
  -- FPO (1), admin (1)
  ('30000001-0000-0000-0000-000000000017', '9090950017', 'fpo', 'Nashik Farmer Producer Co', 'Niphad', '{}', null, null),
  ('30000001-0000-0000-0000-000000000018', '9090950018', 'admin', 'Admin', null, '{}', null, null);

-- ---------------------------------------------------------------------
-- Wipe: everything a demo person currently owns, computed *before* any
-- delete below runs (so a lot already swept into a mega lot, or a deal
-- made during an earlier practice run, is still found). FK order matches
-- CLAUDE.md's architecture table: pods -> shipments -> khata_entries ->
-- payouts -> escrow_events -> escrows -> deals -> bids -> mega lots -> lots
-- -> grade_results. Most of these FKs are `on delete no action`
-- (confirmed against cropket-dev), so the order below is required, not
-- just tidy.
-- ---------------------------------------------------------------------
create temporary table demo_deal_ids (id uuid primary key) on commit drop;

insert into demo_deal_ids
select d.id from deals d
where d.buyer_id in (select id from demo_people)
   or (d.lot_id is not null and d.lot_id in (select id from lots where farmer_id in (select id from demo_people)))
   or (d.mega_lot_id is not null and d.mega_lot_id in (
         select mega_lot_id from mega_lot_items where farmer_id in (select id from demo_people)
       ));

create temporary table demo_mega_lot_ids (id uuid primary key) on commit drop;

insert into demo_mega_lot_ids
select distinct mega_lot_id from mega_lot_items where farmer_id in (select id from demo_people);

delete from pods where shipment_id in (select id from shipments where deal_id in (select id from demo_deal_ids));
delete from shipments where deal_id in (select id from demo_deal_ids);
delete from khata_entries where deal_id in (select id from demo_deal_ids);
delete from payouts where escrow_id in (select id from escrows where deal_id in (select id from demo_deal_ids));
delete from escrow_events where escrow_id in (select id from escrows where deal_id in (select id from demo_deal_ids));
delete from escrows where deal_id in (select id from demo_deal_ids);
delete from deals where id in (select id from demo_deal_ids);

delete from bids
where buyer_id in (select id from demo_people)
   or lot_id in (select id from lots where farmer_id in (select id from demo_people))
   or mega_lot_id in (select id from demo_mega_lot_ids);

-- A mega lot can hold a non-demo (dev-account) farmer's lot too, if it was
-- close enough to a demo lot when group_mega_lots fired. Release it back
-- to 'listed' before the mega lot is deleted, so a dev farmer's own lot is
-- never left stuck `in_mega` with nothing to sell it.
update lots set status = 'listed'
where status = 'in_mega'
  and farmer_id not in (select id from demo_people)
  and id in (select lot_id from mega_lot_items where mega_lot_id in (select id from demo_mega_lot_ids));

delete from mega_lot_items where mega_lot_id in (select id from demo_mega_lot_ids);
delete from mega_lots where id in (select id from demo_mega_lot_ids);

delete from lots where farmer_id in (select id from demo_people);
delete from grade_results where farmer_id in (select id from demo_people);

-- ---------------------------------------------------------------------
-- Insert: profiles first (auth.users rows already exist - made by
-- scripts/demo-reset.ts through the Admin API before this file runs),
-- `do update` so a name/language/banned changed by hand during a demo is
-- put back.
-- ---------------------------------------------------------------------
insert into profiles (id, name, role, phone, village, district, state, crops, location, language)
select
  id, name, role, phone, village, 'Nashik', 'Maharashtra', crops,
  case when lng is not null then format('SRID=4326;POINT(%s %s)', lng, lat)::geography else null end,
  'mr'
from demo_people
on conflict (id) do update set
  name = excluded.name, role = excluded.role, village = excluded.village,
  district = excluded.district, state = excluded.state, crops = excluded.crops,
  location = excluded.location, language = excluded.language,
  kyc_status = 'pending', trust_score = 0, strikes = 0, banned = false;

-- buyer_kyc: 13-15 verified, 16 left pending on purpose (SPEC §8.6 "1
-- unverified"). `buyer_kyc_sync` (20260922120000_buyer_kyc.sql) copies
-- `status` into `profiles.kyc_status` on this same insert/update, so the
-- profiles insert above doesn't need to touch kyc_status for buyers itself.
insert into buyer_kyc (buyer_id, business_name, gst_number, pan_last4, status, source) values
  ('30000001-0000-0000-0000-000000000013', 'Sharma Traders', '27AAAPS1234C1Z5', 'S123', 'verified', 'mock'),
  ('30000001-0000-0000-0000-000000000014', 'Patil Agro Exports', '27AAAPP5678D1Z2', 'P456', 'verified', 'mock'),
  ('30000001-0000-0000-0000-000000000015', 'Nashik Fresh Produce', '27AAAPN4321E1Z8', 'N789', 'verified', 'mock'),
  ('30000001-0000-0000-0000-000000000016', 'Om Trading Co', '27AAAPO8765F1Z1', 'O234', 'pending', 'mock')
on conflict (buyer_id) do update set
  business_name = excluded.business_name, gst_number = excluded.gst_number,
  pan_last4 = excluded.pan_last4, status = excluded.status, source = excluded.source;

-- grade_results + lots for the 8 marketplace lots (SPEC §5.6 "kind" /
-- "source" - 'mock' so the lot card's <DemoDataTag> shows, matching the
-- "every mock shows the Demo data tag" honesty rule). `photo_paths '{}'`
-- because there are no sample photos in ai-service/samples/onion/ yet -
-- lots.ts's card already renders its no-photo placeholder for that case.
insert into grade_results
  (id, farmer_id, crop, status, grade, confidence, size_label, colour_pct, damage_pct, photo_paths, kind, needs_human_check, source, client_created_at) values
  ('30000003-0000-0000-0000-000000000001', '30000001-0000-0000-0000-000000000002', 'onion', 'done', 'B', 81, 'medium', 72, 6, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000002', '30000001-0000-0000-0000-000000000003', 'onion', 'done', 'B', 79, 'medium', 70, 8, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000003', '30000001-0000-0000-0000-000000000004', 'onion', 'done', 'B', 83, 'medium', 74, 5, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000004', '30000001-0000-0000-0000-000000000005', 'onion', 'done', 'B', 80, 'medium', 71, 7, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000005', '30000001-0000-0000-0000-000000000006', 'onion', 'done', 'A', 91, 'large', 88, 2, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000006', '30000001-0000-0000-0000-000000000007', 'onion', 'done', 'B', 84, 'medium', 75, 6, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000007', '30000001-0000-0000-0000-000000000008', 'potato', 'done', 'B', 77, 'medium', 65, 9, '{}', 'indicative', false, 'mock', now()),
  ('30000003-0000-0000-0000-000000000008', '30000001-0000-0000-0000-000000000009', 'tomato', 'done', 'A', 88, 'medium', 82, 3, '{}', 'indicative', false, 'mock', now());

-- Inserted as 'draft' then flipped to 'listed' below (not inserted straight
-- as 'listed') because `lots_group_mega_lots` only fires `after update of
-- status`, the same path a real farmer's "list this lot" action takes
-- (20260922170000_mega_lots.sql) - so the 500 kg mega lot below is made by
-- the real trigger, not hand-inserted.
insert into lots (id, farmer_id, crop, quantity_kg, grade_result_id, grade, location, status, qr_code, client_created_at) values
  ('30000002-0000-0000-0000-000000000001', '30000001-0000-0000-0000-000000000002', 'onion', 140, '30000003-0000-0000-0000-000000000001', 'B', 'SRID=4326;POINT(74.1150 20.0860)', 'draft', 'L-950101', now()),
  ('30000002-0000-0000-0000-000000000002', '30000001-0000-0000-0000-000000000003', 'onion', 130, '30000003-0000-0000-0000-000000000002', 'B', 'SRID=4326;POINT(74.1080 20.0830)', 'draft', 'L-950102', now()),
  ('30000002-0000-0000-0000-000000000003', '30000001-0000-0000-0000-000000000004', 'onion', 120, '30000003-0000-0000-0000-000000000003', 'B', 'SRID=4326;POINT(74.1200 20.0900)', 'draft', 'L-950103', now()),
  ('30000002-0000-0000-0000-000000000004', '30000001-0000-0000-0000-000000000005', 'onion', 110, '30000003-0000-0000-0000-000000000004', 'B', 'SRID=4326;POINT(74.1050 20.0790)', 'draft', 'L-950104', now()),
  ('30000002-0000-0000-0000-000000000005', '30000001-0000-0000-0000-000000000006', 'onion', 800, '30000003-0000-0000-0000-000000000005', 'A', 'SRID=4326;POINT(74.2340 20.1462)', 'draft', 'L-950105', now()),
  ('30000002-0000-0000-0000-000000000006', '30000001-0000-0000-0000-000000000007', 'onion', 1200, '30000003-0000-0000-0000-000000000006', 'B', 'SRID=4326;POINT(73.9998 20.1725)', 'draft', 'L-950106', now()),
  ('30000002-0000-0000-0000-000000000007', '30000001-0000-0000-0000-000000000008', 'potato', 600, '30000003-0000-0000-0000-000000000007', 'B', 'SRID=4326;POINT(74.4864 20.0433)', 'draft', 'L-950107', now()),
  ('30000002-0000-0000-0000-000000000008', '30000001-0000-0000-0000-000000000009', 'tomato', 450, '30000003-0000-0000-0000-000000000008', 'A', 'SRID=4326;POINT(74.2333 20.3333)', 'draft', 'L-950108', now());

-- One statement, all 8 rows - lots 01-04 (140+130+120+110 = 500 kg, same
-- crop/grade, all within 10 km of Niphad) reach group_mega_lots()'s target
-- and become one mega lot; 05-08 are each too big, or have no small
-- same-crop-and-grade sibling nearby, so they stay standalone 'listed' lots.
update lots set status = 'listed'
where id in (
  '30000002-0000-0000-0000-000000000001', '30000002-0000-0000-0000-000000000002',
  '30000002-0000-0000-0000-000000000003', '30000002-0000-0000-0000-000000000004',
  '30000002-0000-0000-0000-000000000005', '30000002-0000-0000-0000-000000000006',
  '30000002-0000-0000-0000-000000000007', '30000002-0000-0000-0000-000000000008'
);

-- 2 competing bids on the 1,200 kg lot (06), so LiveBidBox has something to
-- show live. The demo buyer (13) places none - bidding live is part of the
-- demo script itself.
insert into bids (id, lot_id, buyer_id, price_per_quintal_paise, status) values
  ('30000004-0000-0000-0000-000000000001', '30000002-0000-0000-0000-000000000006', '30000001-0000-0000-0000-000000000014', 195000, 'active'),
  ('30000004-0000-0000-0000-000000000002', '30000002-0000-0000-0000-000000000006', '30000001-0000-0000-0000-000000000015', 198000, 'active');
