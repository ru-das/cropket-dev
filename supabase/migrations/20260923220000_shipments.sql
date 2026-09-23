-- shipments + pods + record_pod() (SPEC.md §4.16, §5.3, §5.4, §5.6, §5.7,
-- §9.2 Phase 4 "4.7"). The P0 "simple driver page": a farmer makes one
-- driver link per deal (shipments-create, an Edge Function), the driver
-- (no login, via the `trip` function) uploads a delivery photo and the
-- escrow moves IN_TRANSIT -> DELIVERED, same "one function, one
-- transaction" shape mark_dispatched()/fund_escrow() already use.
--
-- Columns dropped vs SPEC §5.6's shipments row, same reasoning
-- route_cache.alternatives gave (20260917141016_route_cache.sql): nothing
-- in the prototype writes or reads them.
-- - transporter_id: no transporter picker (P1, Phase 5's truck booking) -
--   the farmer types the driver's phone and vehicle number by hand.
-- - status: the escrow's own state is the single source of truth, same
--   call mark_dispatched()'s handoff note made for lots.status.
-- - route_risk_score, language: both Phase 5/P1 (geofence risk, driver
--   language on the trip page - the driver page uses LanguageSwitch
--   instead, same component every other screen uses).
--
-- trip_token_hash only, never the token itself - same reasoning
-- deliveryOtp.ts gives for not storing the delivery code: a database leak
-- reveals nothing. One shipment per deal (unique), same "one X per Y"
-- shape deals_lot_id_key gave.
create table shipments (
  id uuid primary key default gen_random_uuid (),
  deal_id uuid not null unique references deals (id),
  driver_phone text not null check (driver_phone ~ '^[6-9][0-9]{9}$'),
  vehicle_number text not null,
  trip_token_hash text not null unique,
  token_expires_at timestamptz not null,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

alter table shipments enable row level security;

revoke all on shipments from anon, authenticated;

-- The seller (farmer who owns the lot) can see their own shipment's
-- vehicle number and link expiry - never trip_token_hash (excluded from
-- the column grant below; only shipments-create/trip, both service role,
-- ever read it).
create policy shipments_select_seller on shipments
  for select to authenticated
  using (exists (
    select 1 from deals d join lots l on l.id = d.lot_id
    where d.id = shipments.deal_id and l.farmer_id = auth.uid ()
  ));

grant select (id, deal_id, driver_phone, vehicle_number, token_expires_at, created_at, updated_at)
  on shipments to authenticated;

-- The delivery photo (SPEC §4.16 step 4, §5.6 `pods`). location is
-- nullable - a driver who denies GPS must still be able to deliver
-- (CLAUDE.md §5 offline/degraded features never block the core action).
create table pods (
  shipment_id uuid primary key references shipments (id),
  photo_path text not null,
  location geography (point, 4326),
  taken_at timestamptz not null,
  created_at timestamptz not null default now ()
);

alter table pods enable row level security;

revoke all on pods from anon, authenticated;

-- No client policy at all - only record_pod() (service role, below) ever
-- writes a row, and nothing in the app reads pods directly yet (no farmer/
-- buyer "see the delivery photo" screen in the prototype).

-- Private bucket for the delivery photo. No client storage policies at
-- all - the uploader is the `trip` Edge Function (service role), not the
-- driver's own Supabase session, since the driver has none.
insert into storage.buckets (id, name, public)
values ('pod', 'pod', false)
on conflict (id) do nothing;

-- record_pod(): the only way an escrow reaches DELIVERED (SPEC §5.7).
-- Service-role only, same shape fund_escrow()/mark_dispatched() use: one
-- function, one transaction, so the pod row, the state move and the
-- Khata row can never happen one without the others.
create function record_pod(
  p_shipment_id uuid, p_photo_path text, p_lat double precision, p_lng double precision,
  p_taken_at timestamptz
) returns escrows
language plpgsql
security definer
-- extensions is required here, not just public - PostGIS (st_makepoint,
-- st_setsrid) lives in that schema on cropket-dev, same fix
-- 20260922170000_mega_lots.sql's group_mega_lots() already made.
set search_path = public, extensions
as $$
declare
  v_deal deals;
  e      escrows;
begin
  select d.* into v_deal from shipments s join deals d on d.id = s.deal_id
  where s.id = p_shipment_id;
  if v_deal.id is null then
    raise exception 'SHIPMENT_NOT_FOUND';
  end if;

  select * into e from escrows where deal_id = v_deal.id for update;
  if not found then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  -- Idempotent repeat: a driver who reloads mid-upload and taps again must
  -- not throw or write a second pod/Khata row - it returns DELIVERED
  -- unchanged, same shape mark_dispatched()'s own state-equality branch.
  if e.state = 'DELIVERED' then
    return e;
  end if;

  if e.state <> 'IN_TRANSIT' then
    raise exception 'ESCROW_WRONG_STATE';
  end if;

  -- ponytail: same gap fund_escrow()/mark_dispatched() already carry - a
  -- mega-lot deal (lot_id null) has no single farmer to credit, and
  -- nothing in the prototype gets a mega-lot deal this far yet (3.4/3.5's
  -- still-open gap). Dead code today, not a new limitation. Upgrade path:
  -- one khata_entries row per mega_lot_items farmer, split by
  -- quantity_kg, same split.ts will do for release.
  if v_deal.lot_id is null then
    raise exception 'NOT_IMPLEMENTED mega_lot_deal';
  end if;

  insert into pods (shipment_id, photo_path, location, taken_at)
  values (
    p_shipment_id, p_photo_path,
    case when p_lat is null or p_lng is null then null
         else geography (st_setsrid (st_makepoint (p_lng, p_lat), 4326)) end,
    p_taken_at
  )
  on conflict (shipment_id) do nothing;

  e := escrow_transition(e.id, 'DELIVERED', 'pod', null);

  -- No new khata_colour value for "delivered, still locked" - yellow
  -- already means "money locked safely" (SPEC §4.15 legend), which is
  -- exactly true again now the goods have arrived and the money is
  -- waiting on the OTP/24h timer, not the truck.
  insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key, title_values)
  select l.farmer_id, v_deal.id, v_deal.total_paise, 'yellow', 'khata.deliveredLocked',
         jsonb_build_object('crop', l.crop, 'quantityKg', v_deal.quantity_kg)
  from lots l where l.id = v_deal.lot_id;

  return e;
end;
$$;

revoke all on function record_pod(uuid, text, double precision, double precision, timestamptz)
  from public, anon, authenticated;

grant execute on function record_pod(uuid, text, double precision, double precision, timestamptz)
  to service_role;
