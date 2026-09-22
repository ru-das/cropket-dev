-- bids + place_bid (SPEC.md §5.3, §5.6, §9.2 Phase 3 "3.3"). The first
-- supabase.rpc() call and the first Realtime table in this project - both
-- patterns 3.6 (accept_bid) and M4 (escrow) reuse.
--
-- Column is `price_per_quintal_paise`, not SPEC §5.6's shorthand
-- `price_per_quintal` - every money value in this codebase ends in `_paise`
-- (modal_price_paise, msp_per_quintal_paise) and floor.ts/money.ts both name
-- the value `pricePerQuintalPaise`. Following the code, not the doc table.
--
-- `mega_lot_id` has no FK yet - `mega_lots` doesn't exist until 3.4, which
-- adds the constraint alongside the table. `target_type` in place_bid below
-- only accepts 'lot' for the same reason; 3.4 opens it with
-- `create or replace function`, not a new function.
--
-- No insert grant on `bids` at all - SPEC §5.6 phrases "verified, not
-- banned" as an insert RLS policy, but place_bid (security definer) already
-- has to check it, and the same function has to write `rate_limits`
-- atomically with the bid. One enforcement point beats two, and
-- rls_bids.sql proves a direct client insert is refused either way.
create table bids (
  id uuid primary key default gen_random_uuid (),
  lot_id uuid references lots (id) on delete cascade,
  mega_lot_id uuid,
  buyer_id uuid not null references profiles (id),
  price_per_quintal_paise bigint not null check (
    price_per_quintal_paise > 0 and price_per_quintal_paise <= 10000000
  ),
  status text not null default 'active' check (status in ('active', 'accepted', 'rejected')),
  created_at timestamptz not null default now (),
  check (num_nonnulls (lot_id, mega_lot_id) = 1)
);

create index bids_lot_created_idx on bids (lot_id, created_at desc);

alter table bids enable row level security;

-- The live board every buyer on a listed lot sees, and what the farmer's
-- bids screen (3.5) will read too (a farmer reads their own lot's bids
-- through this same policy - no farmer-specific policy needed since a lot
-- they own and have listed is, by definition, `status = 'listed'`).
create policy bids_select_listed on bids
  for select to authenticated
  using (
    exists (
      select 1 from lots l
      where l.id = bids.lot_id and l.status = 'listed'
    )
  );

-- Your own bid stays visible to you after the lot leaves 'listed' (sold,
-- rejected, etc.) - the row the buyer's own bid history/deal flow needs.
create policy bids_select_own on bids
  for select to authenticated
  using (buyer_id = auth.uid ());

revoke all on bids from anon, authenticated;

grant select on bids to authenticated;

-- rate_limits (SPEC §5.2: "bids 10 per minute per buyer"). RLS on, no
-- policies and no grants at all - only a security definer function (below)
-- ever reads or writes it, the same "grants, not trust" shape profiles'
-- column grants use.
create table rate_limits (
  key text primary key,
  window_start timestamptz not null default now (),
  count integer not null default 0
);

alter table rate_limits enable row level security;

revoke all on rate_limits from anon, authenticated;

-- place_bid: the only way a bid is created (SPEC §5.3). security definer so
-- it alone can write rate_limits and bypass the RLS that would otherwise
-- block every insert. Every check happens inside one transaction, so a
-- raise anywhere - including over the rate limit - rolls the whole call
-- back, rate-limit bump included: the counter caps at 10 and self-heals
-- once the window rolls over, it never gets stuck above the cap.
create function place_bid(
  p_target_type text,
  p_target_id uuid,
  p_price_per_quintal_paise bigint
)
returns table (bid_id uuid, is_highest boolean, below_floor boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid ();
  v_role user_role;
  v_kyc_status text;
  v_banned boolean;
  v_status lot_status;
  v_crop text;
  v_key text;
  v_count int;
  v_floor_method text;
  v_msp bigint;
  v_floor_paise bigint;
  v_bid_id uuid;
  v_is_highest boolean;
  v_below_floor boolean;
begin
  if v_buyer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  if p_price_per_quintal_paise <= 0 or p_price_per_quintal_paise > 10000000 then
    raise exception 'VALIDATION_FAILED';
  end if;

  select role, kyc_status, banned into v_role, v_kyc_status, v_banned
  from profiles where id = v_buyer_id;

  if v_role is distinct from 'buyer' or v_kyc_status is distinct from 'verified'
     or coalesce(v_banned, true) then
    raise exception 'BUYER_NOT_VERIFIED';
  end if;

  -- mega_lots doesn't exist until 3.4 - nothing to look up yet.
  if p_target_type <> 'lot' then
    raise exception 'UNSUPPORTED_TARGET';
  end if;

  -- Row lock (AGENTS.md §4 "use row locks for bids") - two concurrent bids
  -- on the same lot serialize here, so is_highest below is never computed
  -- from a stale read.
  select status, crop into v_status, v_crop
  from lots where id = p_target_id
  for update;

  if not found or v_status <> 'listed' then
    raise exception 'LOT_NOT_LISTED';
  end if;

  v_key := 'bid:' || v_buyer_id::text;
  insert into rate_limits (key, window_start, count)
  values (v_key, now(), 1)
  on conflict (key) do update
    set window_start = case
          when rate_limits.window_start < now() - interval '1 minute' then now()
          else rate_limits.window_start
        end,
        count = case
          when rate_limits.window_start < now() - interval '1 minute' then 1
          else rate_limits.count + 1
        end
  returning count into v_count;

  if v_count > 10 then
    raise exception 'RATE_LIMITED';
  end if;

  -- Mirrors floor.ts's referenceFloorPaise() exactly, so the app's and the
  -- server's warning never disagree: MSP crops use MSP, everyone else uses
  -- the nearest-rank 20th-percentile modal price of the last 30 days.
  select floor_method, msp_per_quintal_paise into v_floor_method, v_msp
  from crop_rules where crop = v_crop;

  if v_floor_method = 'msp' then
    v_floor_paise := v_msp;
  else
    -- Same day boundary as the app's todayIso() (Asia/Kolkata), so SQL and
    -- the client never pick a different 30-day window.
    select (array_agg(modal_price_paise order by modal_price_paise))
           [greatest(1, ceil(0.2 * count(*))::int)]
    into v_floor_paise
    from mandi_prices
    where crop = v_crop
      and date >= ((now() at time zone 'Asia/Kolkata')::date - 30);
  end if;

  -- Advisory only (CLAUDE.md §6 "the floor price warns, never blocks") - a
  -- below-floor bid is still inserted below.
  v_below_floor := v_floor_paise is not null and p_price_per_quintal_paise < v_floor_paise;

  insert into bids (lot_id, buyer_id, price_per_quintal_paise)
  values (p_target_id, v_buyer_id, p_price_per_quintal_paise)
  returning id into v_bid_id;

  select not exists (
    select 1 from bids b
    where b.lot_id = p_target_id
      and b.status = 'active'
      and b.price_per_quintal_paise > p_price_per_quintal_paise
  ) into v_is_highest;

  return query select v_bid_id, v_is_highest, v_below_floor;
end;
$$;

revoke all on function place_bid (text, uuid, bigint) from public, anon;

grant execute on function place_bid (text, uuid, bigint) to authenticated;

-- First table in this project on Realtime (SPEC §5.6 channel `bids:lot:{id}`,
-- consumed by LiveBidBox in 3.3b). RLS still filters what each subscriber
-- actually receives - a buyer only gets INSERT events for lots they can
-- already select under bids_select_listed/bids_select_own.
alter publication supabase_realtime add table bids;
