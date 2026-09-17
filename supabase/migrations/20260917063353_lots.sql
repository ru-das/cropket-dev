-- lots: one row per Digital Lot (SPEC.md §5.6, §4.7, §9.2 Phase 1 "1.6").
-- Created by the phone (id, qr_code and client_created_at are all made
-- offline in app/src/services/lots.ts) so a farmer can save a lot with no
-- internet and it uploads itself later (SPEC.md §5.8) - `qr_code` cannot be
-- a DB default because the farmer must be able to read and print it before
-- the row ever reaches the server. grade_result_id links back to 1.3/1.5's
-- grade_results row; it is nullable because "check price only" (P1, not
-- built yet) would create a lot with no scan at all.

create type lot_status as enum (
  'draft', 'listed', 'in_mega', 'sold', 'in_transit', 'delivered', 'rescued', 'salvage'
);

create table lots (
  id uuid primary key,
  farmer_id uuid not null references profiles (id) on delete cascade,
  crop text not null check (crop in ('onion', 'tomato', 'potato')),
  quantity_kg integer not null check (quantity_kg > 0 and quantity_kg <= 100000),
  grade_result_id uuid references grade_results (id) on delete set null,
  grade text check (grade in ('A', 'B', 'C')),
  location geography (point, 4326),
  status lot_status not null default 'draft',
  -- Human-readable short code (lotCode() in _shared/domain/lotCode.ts), e.g.
  -- "L-204173". No unique constraint on purpose: it's a display label, not
  -- an id - a clash must never stop a real lot being saved.
  qr_code text not null,
  client_created_at timestamptz,
  created_at timestamptz not null default now()
);

create index lots_farmer_created_idx on lots (farmer_id, created_at desc);

alter table lots enable row level security;

create policy lots_select_own on lots
  for select to authenticated
  using (farmer_id = auth.uid ());

create policy lots_insert_own on lots
  for insert to authenticated
  with check (farmer_id = auth.uid ());

-- No update/delete grant yet - nothing changes a lot's status until 3.2
-- (listing it for buyers) and later milestones (mega lots, sold, shipped).
-- Add those grants when that logic lands, not before.
revoke all on lots from anon, authenticated;

grant select on lots to authenticated;

grant insert (
  id, farmer_id, crop, quantity_kg, grade_result_id, grade, location, qr_code, client_created_at
) on lots to authenticated;
