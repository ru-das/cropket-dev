-- Reopens accept_bid (20260923160000_deals.sql) to also create the escrow
-- (SPEC.md §5.3, §9.2 Phase 4 "4.1") - that migration's own header said
-- this reopen was coming. `drop` + recreate, not `create or replace`:
-- the OUT columns change (deal_id -> deal_id, escrow_id), and Postgres
-- won't let `create or replace` change a function's return columns.
--
-- escrows.total_paise = deal total + fee (decided with the user): the
-- escrow holds everything the buyer pays, so release payouts (farmer
-- shares + a platform_fee payout) sum to the escrow total to the paisa.
-- The Khata still shows the deal total, not this bigger number.
--
-- Still no OTP hash and no Khata row - those are 4.5 and 4.3 (🟡 only
-- appears once Cashfree's webhook marks the escrow FUNDED, not at
-- creation). The creation event below is the escrow's first
-- escrow_events row, matching escrow_transition()'s own shape (from_state
-- null only there).
drop function accept_bid (uuid, text);

create function accept_bid(p_bid_id uuid, p_consent_audio_path text)
returns table (deal_id uuid, escrow_id uuid)
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
  v_existing_escrow_id uuid;
  v_deal_id uuid;
  v_escrow_id uuid;
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
  -- a deal that already exists - it returns the same ids instead.
  select id into v_existing_deal_id from deals where lot_id = v_lot_id;
  if v_existing_deal_id is not null then
    -- `escrows.deal_id` (a plain column reference) would be ambiguous
    -- here: this function's OUT parameters (deal_id, escrow_id) are also
    -- in scope as plpgsql variables, so the table needs its own alias.
    select id into v_existing_escrow_id from escrows es where es.deal_id = v_existing_deal_id;
    return query select v_existing_deal_id, v_existing_escrow_id;
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
  -- `p_pickup_date date default null` here with `create or replace` and
  -- fall back to this default when it's null - no schema change, no
  -- caller breaks.
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

  -- The escrow holds the full buyer payment (deal total + fee) - decided
  -- with the user, see this file's header.
  insert into escrows (deal_id, total_paise)
  values (v_deal_id, v_total_paise + v_fee_paise)
  returning id into v_escrow_id;

  insert into escrow_events (escrow_id, from_state, to_state, reason, actor)
  values (v_escrow_id, null, 'CREATED', 'deal accepted', v_farmer_id);

  update bids set status = 'accepted' where id = p_bid_id;
  update bids set status = 'rejected' where lot_id = v_lot_id and status = 'active' and id <> p_bid_id;
  update lots set status = 'sold' where id = v_lot_id;

  return query select v_deal_id, v_escrow_id;
end;
$$;

revoke all on function accept_bid (uuid, text) from public, anon;

grant execute on function accept_bid (uuid, text) to authenticated;
