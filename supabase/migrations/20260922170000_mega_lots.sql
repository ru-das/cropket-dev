-- Mega lot grouping (SPEC.md §5.3, §5.6, §9.2 Phase 3 "3.4"). A lot too
-- small to interest a truck-buying trader gets bundled with nearby lots of
-- the same crop and grade the moment enough of them are listed - the
-- problem 3.1-3.3 left unsolved for a 150 kg farmer.
--
-- A lot is sellable in exactly one place at a time: grouping flips member
-- lots `listed -> in_mega` and the mega lot becomes the biddable thing
-- (decided with the user). Only small, bid-free lots are swept
-- (`quantity_kg < target` and no bids yet) - the point of this feature is
-- "many small farmers", it protects a big single lot (like the §9.1 demo's
-- 500 kg lot) from being pulled in mid-demo, and it never orphans a live bid.
--
-- `search_path = public, extensions` on the trigger function is required -
-- PostGIS lives in `extensions` on cropket-dev, not `public` (see
-- 20260917125931_agmarknet_link.sql, the only other security definer
-- function here that calls st_dwithin - same reason, same fix).
create table mega_lots (
  id uuid primary key default gen_random_uuid (),
  crop text not null check (crop in ('onion', 'tomato', 'potato')),
  grade text not null check (grade in ('A', 'B', 'C')),
  total_kg integer not null check (total_kg > 0),
  -- Never written in 3.4 - the FPO dashboard that would set it is P1
  -- (SPEC.md §9.2), out of this milestone's scope.
  fpo_id uuid references profiles (id),
  location geography (point, 4326) not null,
  -- Reuses lot_status's values rather than a new enum, narrowed to the two
  -- this table actually needs - a mega lot is either up for bidding or
  -- already sold (3.6's accept_bid sets that later).
  status lot_status not null default 'listed' check (status in ('listed', 'sold')),
  created_at timestamptz not null default now ()
);

alter table mega_lots
  add column lat double precision generated always as (st_y (location::geometry)) stored,
  add column lng double precision generated always as (st_x (location::geometry)) stored;

create index mega_lots_status_created_idx on mega_lots (status, created_at desc);

alter table mega_lots enable row level security;

create policy mega_lots_select_listed on mega_lots
  for select to authenticated
  using (status = 'listed');

revoke all on mega_lots from anon, authenticated;

grant select on mega_lots to authenticated;

-- Membership. `unique (lot_id)` is the constraint that makes "a lot belongs
-- to at most one mega lot" a database fact, not just a trigger promise.
create table mega_lot_items (
  id uuid primary key default gen_random_uuid (),
  mega_lot_id uuid not null references mega_lots (id) on delete cascade,
  lot_id uuid not null unique references lots (id) on delete cascade,
  farmer_id uuid not null references profiles (id),
  quantity_kg integer not null check (quantity_kg > 0)
);

alter table mega_lot_items enable row level security;

-- Anyone can see the membership of a listed mega lot (the buyer detail page
-- needs it); a farmer keeps seeing their own row even after it sells - 3.5/
-- 3.6 need that once the mega lot moves past 'listed'.
create policy mega_lot_items_select on mega_lot_items
  for select to authenticated
  using (
    farmer_id = auth.uid ()
    or exists (select 1 from mega_lots m where m.id = mega_lot_items.mega_lot_id and m.status = 'listed')
  );

revoke all on mega_lot_items from anon, authenticated;

grant select on mega_lot_items to authenticated;

-- Three buyer-read policies from 20260922150000_lots_marketplace.sql hard-
-- code `status = 'listed'`. The moment grouping flips a lot to `in_mega`,
-- widen them the same way or the lot (and its grade + photo) vanish from
-- every buyer's screen, including the mega lot detail page that still needs
-- to show them. A `draft` lot stays exactly as private as before either way.
alter policy lots_select_listed on lots
  using (status in ('listed', 'in_mega'));

alter policy grade_results_select_listed on grade_results
  using (
    exists (
      select 1 from lots l
      where l.grade_result_id = grade_results.id and l.status in ('listed', 'in_mega')
    )
  );

alter policy crop_photos_select_listed on storage.objects
  using (
    bucket_id = 'crop-photos'
    and exists (
      select 1 from grade_results g
      join lots l on l.grade_result_id = g.id
      where l.status in ('listed', 'in_mega') and storage.objects.name = any (g.photo_paths)
    )
  );

-- No spatial index existed on any `location` column before this migration -
-- group_mega_lots() below runs an st_dwithin over `lots` on every listing.
create index lots_location_idx on lots using gist (location);

-- group_mega_lots(): fires after a lot is listed, bundles it with nearby
-- unsold, bid-free small lots of the same crop and grade once their total
-- reaches the target. security definer because it has to write mega_lots/
-- mega_lot_items (no client grant on either) and flip *other farmers'* lots
-- to in_mega - lots_update_own_list only ever allows an own-row draft ->
-- listed update.
create function group_mega_lots() returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  -- ponytail: a constant, not a row in SPEC §5.6's app_config table - that
  -- table doesn't exist yet and nothing else needs it. Move it there when
  -- M4's platform_fee_bps gives app_config a second reason to exist.
  v_target_kg constant int := 500;
  v_mega_lot_id uuid;
  v_ids uuid[];
  v_total int;
begin
  if new.location is null or new.quantity_kg >= v_target_kg then
    return null;
  end if;

  -- Same crop + grade, unsold, smaller than the target, within 10 km
  -- (st_dwithin on a geography column takes metres), and not already
  -- carrying a bid - a bid mid-flight is never orphaned by a regroup. This
  -- select runs inside the same transaction as the update that fired the
  -- trigger, so it already sees new's own committed row and includes it
  -- naturally - no need to union it in by hand.
  select array_agg(l.id), sum(l.quantity_kg)::int
  into v_ids, v_total
  from lots l
  where l.crop = new.crop
    and l.grade = new.grade
    and l.status = 'listed'
    and l.quantity_kg < v_target_kg
    and l.location is not null
    and st_dwithin (l.location, new.location, 10000)
    and not exists (select 1 from bids b where b.lot_id = l.id);

  if v_total is null or v_total < v_target_kg or array_length(v_ids, 1) < 2 then
    return null;
  end if;

  insert into mega_lots (crop, grade, total_kg, location, status)
  values (new.crop, new.grade, v_total, new.location, 'listed')
  returning id into v_mega_lot_id;

  insert into mega_lot_items (mega_lot_id, lot_id, farmer_id, quantity_kg)
  select v_mega_lot_id, l.id, l.farmer_id, l.quantity_kg
  from lots l
  where l.id = any (v_ids);

  update lots set status = 'in_mega' where id = any (v_ids);

  return null;
end;
$$;

-- `when` doubles as the recursion guard: the update above sets status to
-- 'in_mega', never 'listed', so it never re-satisfies this condition and
-- re-fires the trigger. Listing is always an update (lots_update_own_list,
-- 20260922140000_lot_listing.sql has the only path to 'listed') - there is
-- no insert-as-listed path today, so `after update` is the whole surface.
create trigger lots_group_mega_lots
after update of status on lots
for each row
when (new.status = 'listed' and old.status is distinct from 'listed')
execute function group_mega_lots ();

-- Bids on a mega lot (the FK 3.3's migration header promised).
alter table bids
  add constraint bids_mega_lot_id_fkey foreign key (mega_lot_id) references mega_lots (id) on delete cascade;

create index bids_mega_lot_created_idx on bids (mega_lot_id, created_at desc);

-- bids_select_listed (20260922160000_bids.sql) only joins lot_id - without
-- this sibling policy a mega lot's live bid board would be empty for every
-- buyer except the one who placed a bid (bids_select_own still covers them).
create policy bids_select_mega_listed on bids
  for select to authenticated
  using (
    exists (select 1 from mega_lots m where m.id = bids.mega_lot_id and m.status = 'listed')
  );

-- place_bid reopened for 'mega_lot' - same signature, same function, one
-- branch changed (the header comment in 20260922160000_bids.sql pre-
-- committed to `create or replace`, not a new function). Everything after
-- the row lock (rate limit, floor calc, insert, is_highest) is unchanged in
-- shape - it just runs against whichever target the row lock found.
create or replace function place_bid(
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

  -- Row lock (AGENTS.md §4 "use row locks for bids") on whichever target
  -- this bid is for - mega_lots.status reuses lot_status, so v_status
  -- stays one variable for both branches.
  if p_target_type = 'lot' then
    select status, crop into v_status, v_crop
    from lots where id = p_target_id
    for update;
  elsif p_target_type = 'mega_lot' then
    select status, crop into v_status, v_crop
    from mega_lots where id = p_target_id
    for update;
  else
    raise exception 'UNSUPPORTED_TARGET';
  end if;

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
  -- server's warning never disagree - a mega lot has a crop like any lot,
  -- so this query is untouched by the target-type branch above.
  select floor_method, msp_per_quintal_paise into v_floor_method, v_msp
  from crop_rules where crop = v_crop;

  if v_floor_method = 'msp' then
    v_floor_paise := v_msp;
  else
    select (array_agg(modal_price_paise order by modal_price_paise))
           [greatest(1, ceil(0.2 * count(*))::int)]
    into v_floor_paise
    from mandi_prices
    where crop = v_crop
      and date >= ((now() at time zone 'Asia/Kolkata')::date - 30);
  end if;

  v_below_floor := v_floor_paise is not null and p_price_per_quintal_paise < v_floor_paise;

  if p_target_type = 'lot' then
    insert into bids (lot_id, buyer_id, price_per_quintal_paise)
    values (p_target_id, v_buyer_id, p_price_per_quintal_paise)
    returning id into v_bid_id;

    select not exists (
      select 1 from bids b
      where b.lot_id = p_target_id
        and b.status = 'active'
        and b.price_per_quintal_paise > p_price_per_quintal_paise
    ) into v_is_highest;
  else
    insert into bids (mega_lot_id, buyer_id, price_per_quintal_paise)
    values (p_target_id, v_buyer_id, p_price_per_quintal_paise)
    returning id into v_bid_id;

    select not exists (
      select 1 from bids b
      where b.mega_lot_id = p_target_id
        and b.status = 'active'
        and b.price_per_quintal_paise > p_price_per_quintal_paise
    ) into v_is_highest;
  end if;

  return query select v_bid_id, v_is_highest, v_below_floor;
end;
$$;

revoke all on function place_bid (text, uuid, bigint) from public, anon;

grant execute on function place_bid (text, uuid, bigint) to authenticated;
