-- Market reference data (SPEC.md §2.3, §5.6; §9.2 Phase 2 "2.1"). Six tables,
-- all the same shape: read-only reference data that every signed-in user can
-- see and no client can ever write. `supabase/seed.sql` fills them (as the
-- table owner, bypassing RLS); `cron-fetch-prices` (2.3) later writes
-- `mandi_prices`/`mandi_heat` with the service role, same as `seed.sql` does
-- today. Nothing here is per-user, so RLS is a flat "any authenticated user
-- may select" on every table, not an ownership check like `profiles`/`lots`.
--
-- Money: prices are stored as **paise per quintal** (`*_price_paise`), not
-- rupees, so they are the same unit as every other money column in the
-- system (`deals.total_paise`, `payouts.amount_paise`,
-- `transporters.rate_per_km_paise`). data.gov.in publishes whole rupees, so
-- `cron-fetch-prices` (2.3) multiplies by 100 once, at the boundary -
-- nothing downstream ever converts again. `SPEC.md` §5.6 named these columns
-- `min_price`/`max_price`/`modal_price`/`msp_per_quintal` with no unit;
-- fixed to `*_paise` in the same commit as this migration (CLAUDE.md §0 rule 3).
--
-- Two other small deviations from `SPEC.md` §5.6, on purpose:
-- - `mandi_prices`/`mandi_heat`/`weather_daily` use a composite primary key
--   (the natural unique key SPEC.md already describes) instead of a
--   surrogate `id` plus a separate unique index - one less column, same
--   guarantee.
-- - `crop_rules.crop` is limited to the three prototype crops
--   (onion/tomato/potato), matching `_shared/domain/crops.ts` and the same
--   check already on `lots.crop`/`grade_results.crop`. Wheat gets a row when
--   MSP crops are actually built (SPEC.md §2.3 marks it "later").

create table crop_rules (
  crop text primary key check (crop in ('onion', 'tomato', 'potato')),
  perishability int not null check (perishability between 1 and 10),
  max_hold_days int not null check (max_hold_days > 0),
  transit_loss_pct numeric not null check (transit_loss_pct >= 0),
  has_msp boolean not null default false,
  -- only set when has_msp = true; enforced by the app/domain layer, not a
  -- check constraint, so a future MSP crop can't be blocked by a chicken-
  -- and-egg NOT NULL before its MSP is known.
  msp_per_quintal_paise bigint check (msp_per_quintal_paise >= 0),
  floor_method text not null check (floor_method in ('p20_modal_30d', 'msp'))
);

create table mandis (
  id uuid primary key,
  name text not null,
  district text not null default 'Nashik',
  state text not null default 'Maharashtra',
  location geography (point, 4326) not null,
  -- The market name as data.gov.in/Agmarknet spells it, so 2.3's daily
  -- fetch can match a returned row back to this mandi. Nullable + unique
  -- (Postgres allows many nulls in a unique column) because a mandi can
  -- exist here before anyone has confirmed its Agmarknet spelling.
  agmarknet_name text unique
);

create table mandi_prices (
  mandi_id uuid not null references mandis (id) on delete cascade,
  crop text not null check (crop in ('onion', 'tomato', 'potato')),
  date date not null,
  min_price_paise bigint not null check (min_price_paise >= 0),
  max_price_paise bigint not null check (max_price_paise >= 0),
  modal_price_paise bigint not null check (modal_price_paise >= 0),
  arrivals_tonnes numeric not null check (arrivals_tonnes >= 0),
  -- 'seed' = generated demo history (this migration's seed.sql), 'agmarknet'
  -- = real data.gov.in row (2.3), 'mock' = 2.3 ran with no API key set.
  -- Anything other than 'agmarknet' makes the price screen (2.4) show the
  -- grey "Demo data" tag (CLAUDE.md §5 honesty rule).
  source text not null check (source in ('seed', 'agmarknet', 'mock')),
  primary key (mandi_id, crop, date),
  check (min_price_paise <= modal_price_paise and modal_price_paise <= max_price_paise)
);

create index mandi_prices_crop_date_idx on mandi_prices (crop, date desc);

create table mandi_heat (
  mandi_id uuid not null references mandis (id) on delete cascade,
  crop text not null check (crop in ('onion', 'tomato', 'potato')),
  date date not null,
  ratio numeric not null check (ratio >= 0),
  colour text not null check (colour in ('red', 'yellow', 'green')),
  primary key (mandi_id, crop, date)
);

create table weather_daily (
  district text not null,
  date date not null,
  rain_mm numeric not null check (rain_mm >= 0),
  temp_max numeric,
  fetched_at timestamptz not null default now(),
  primary key (district, date)
);

create table transporters (
  id uuid primary key,
  name text not null,
  -- Never selected by the app (see the column grant below) - only read by
  -- `shipments-create` (4.7, service role) when it sends the driver link.
  phone text not null,
  rate_per_km_paise bigint not null check (rate_per_km_paise > 0)
);

alter table crop_rules enable row level security;
alter table mandis enable row level security;
alter table mandi_prices enable row level security;
alter table mandi_heat enable row level security;
alter table weather_daily enable row level security;
alter table transporters enable row level security;

create policy crop_rules_select_all on crop_rules for select to authenticated using (true);
create policy mandis_select_all on mandis for select to authenticated using (true);
create policy mandi_prices_select_all on mandi_prices for select to authenticated using (true);
create policy mandi_heat_select_all on mandi_heat for select to authenticated using (true);
create policy weather_daily_select_all on weather_daily for select to authenticated using (true);
create policy transporters_select_all on transporters for select to authenticated using (true);

-- No insert/update/delete grant anywhere below - the client can physically
-- not write any of these six tables. `seed.sql` runs as the table owner
-- (bypasses RLS and grants); `cron-fetch-prices` (2.3) and `shipments-create`
-- (4.7) use the service role, same as `grade`/`escrow_transition` already do.
revoke all on crop_rules from anon, authenticated;
revoke all on mandis from anon, authenticated;
revoke all on mandi_prices from anon, authenticated;
revoke all on mandi_heat from anon, authenticated;
revoke all on weather_daily from anon, authenticated;
revoke all on transporters from anon, authenticated;

grant select on crop_rules to authenticated;
grant select on mandis to authenticated;
grant select on mandi_prices to authenticated;
grant select on mandi_heat to authenticated;
grant select on weather_daily to authenticated;

-- Column-level grant, not a full table grant: the driver's phone number
-- never leaves the server (SPEC.md §5.6 security rules, CLAUDE.md §5
-- "never log ... phone numbers" - the same idea applies to never *serving*
-- them to a client that has no reason to see them). The app only ever needs
-- the per-km rate for the Net-₹ comparator (2.5).
grant select (id, name, rate_per_km_paise) on transporters to authenticated;
