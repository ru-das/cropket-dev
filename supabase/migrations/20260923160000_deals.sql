-- deals + accept_bid (SPEC.md §4.13, §5.3, §5.6, §9.2 Phase 3 "3.6"). Closes
-- the gap 3.5 left on purpose: "Accept" on BidRow only navigated to the
-- consent route, it never transacted. accept_bid is that transaction - one
-- deal, the losing bids rejected, the lot sold.
--
-- No escrow, no OTP hash here even though SPEC §5.3's one-line description
-- of accept_bid mentions both - `escrows` doesn't exist until 4.1, which
-- reopens this function with `create or replace` the same way 3.4 reopened
-- place_bid. One feature per migration.
--
-- Column is `price_per_quintal_paise`/`total_paise`/`fee_paise`, not SPEC
-- §5.6's shorthand - same reasoning `20260922160000_bids.sql`'s header gives:
-- every money column in this codebase ends in `_paise`.
create table deals (
  id uuid primary key default gen_random_uuid (),
  lot_id uuid references lots (id),
  mega_lot_id uuid, -- no FK yet - same "doesn't exist for this path" note bids.mega_lot_id started with
  buyer_id uuid not null references profiles (id),
  price_per_quintal_paise bigint not null check (price_per_quintal_paise > 0),
  quantity_kg integer not null check (quantity_kg > 0),
  total_paise bigint not null check (total_paise > 0),
  fee_paise bigint not null check (fee_paise >= 0),
  pickup_date date not null,
  consent_audio_path text not null,
  status text not null default 'created' check (status in ('created', 'cancelled')),
  created_at timestamptz not null default now (),
  check (num_nonnulls (lot_id, mega_lot_id) = 1)
);

-- One deal per lot - structural, not just a promise: this is what makes
-- accept_bid's "already have a deal for this bid" check below race-safe
-- under the lot row lock, and what a repeat call finds instead of inserting
-- a second row.
create unique index deals_lot_id_key on deals (lot_id) where lot_id is not null;

alter table deals enable row level security;

-- The buyer who struck the deal, or the farmer whose lot it is - both sides
-- need to see it (the farmer's lot-detail card, later the buyer's pay
-- screen in 4.3). No admin policy yet - nothing today needs one.
create policy deals_select_party on deals
  for select to authenticated
  using (
    buyer_id = auth.uid ()
    or exists (select 1 from lots l where l.id = deals.lot_id and l.farmer_id = auth.uid ())
  );

revoke all on deals from anon, authenticated;

grant select on deals to authenticated;

-- accept_bid: the only way a deal is created (SPEC §5.3). security definer
-- so it alone can write deals and flip bids/lots status, bypassing the RLS
-- that would otherwise block every one of those writes from a farmer's own
-- session. Everything happens inside one transaction under the lot's row
-- lock (the same lock place_bid takes), so a bid landing mid-accept and two
-- concurrent accepts both serialize here.
create function accept_bid(p_bid_id uuid, p_consent_audio_path text)
returns table (deal_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_farmer_id uuid := auth.uid ();
  v_lot_id uuid;
  v_lot_status lot_status;
  v_bid_status text;
  v_buyer_id uuid;
  v_price_per_quintal_paise bigint;
  v_quantity_kg integer;
  v_existing_deal_id uuid;
  v_deal_id uuid;
  v_total_paise bigint;
  -- ponytail: a constant, not a row in SPEC §5.6's app_config table - same
  -- call 20260922170000_mega_lots.sql made for its mega-lot target kg. Move
  -- it there when 4.3 (Cashfree fee line) gives app_config its second
  -- reason to exist.
  v_fee_bps constant int := 100;
  v_fee_paise bigint;
  v_pickup_date date;
begin
  if v_farmer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  -- The recorded consent clip is legal evidence of what the farmer agreed
  -- to - it must exist, and it must sit under this caller's own storage
  -- folder (the same trust boundary crop-photos' RLS checks), never an
  -- empty string or someone else's path handed in by a client.
  if p_consent_audio_path is null or p_consent_audio_path !~ ('^' || v_farmer_id::text || '/') then
    raise exception 'CONSENT_REQUIRED';
  end if;

  -- Row lock on the lot (place_bid's own lock) - a bid arriving mid-accept,
  -- or two accepts racing on the same lot, both serialize here.
  select l.id, l.status, b.status, b.buyer_id, b.price_per_quintal_paise, l.quantity_kg
  into v_lot_id, v_lot_status, v_bid_status, v_buyer_id, v_price_per_quintal_paise, v_quantity_kg
  from bids b
  join lots l on l.id = b.lot_id
  where b.id = p_bid_id
  for update of l;

  -- One error for "no such bid", "not yours" and "this bid is for a mega
  -- lot" (lot_id is null there - SPEC §5.3 gives mega-lot accept to the
  -- FPO, still the gap 3.4/3.5 documented) - a probe can't tell them apart,
  -- same reasoning lot_bids() gives.
  if v_lot_id is null or not exists (
    select 1 from lots where id = v_lot_id and farmer_id = v_farmer_id
  ) then
    raise exception 'LOT_NOT_FOUND';
  end if;

  -- Idempotent repeat: a retry after a network blip (upload succeeded,
  -- accept_bid's response never arrived) must not error the farmer out of
  -- a deal that already exists - it returns the same id instead.
  select id into v_existing_deal_id from deals where lot_id = v_lot_id;
  if v_existing_deal_id is not null then
    return query select v_existing_deal_id;
    return;
  end if;

  if v_bid_status <> 'active' then
    raise exception 'BID_NOT_ACTIVE';
  end if;

  if v_lot_status <> 'listed' then
    raise exception 'LOT_NOT_LISTED';
  end if;

  -- Mirrors grossPaise() in _shared/domain/money.ts exactly, so the deal
  -- total the farmer sees and the one the server writes never disagree.
  v_total_paise := round((v_price_per_quintal_paise::numeric * v_quantity_kg) / 100);
  v_fee_paise := round((v_total_paise::numeric * v_fee_bps) / 10000);
  -- ponytail: fixed at +2 days, not a farmer/buyer input - the consent
  -- screen has no date picker today. Upgrade path: add
  -- `p_pickup_date date default null` here with `create or replace` (the
  -- same reopen shape this migration's own header uses for 4.1) and fall
  -- back to this default when it's null - no schema change, no caller
  -- breaks.
  v_pickup_date := ((now() at time zone 'Asia/Kolkata')::date) + 2;

  insert into deals (
    lot_id, buyer_id, price_per_quintal_paise, quantity_kg,
    total_paise, fee_paise, pickup_date, consent_audio_path
  )
  values (
    v_lot_id, v_buyer_id, v_price_per_quintal_paise, v_quantity_kg,
    v_total_paise, v_fee_paise, v_pickup_date, p_consent_audio_path
  )
  returning id into v_deal_id;

  update bids set status = 'accepted' where id = p_bid_id;
  update bids set status = 'rejected' where lot_id = v_lot_id and status = 'active' and id <> p_bid_id;
  update lots set status = 'sold' where id = v_lot_id;

  return query select v_deal_id;
end;
$$;

revoke all on function accept_bid (uuid, text) from public, anon;

grant execute on function accept_bid (uuid, text) to authenticated;
