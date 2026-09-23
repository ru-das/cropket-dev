-- Demo/dev data for cropket-dev (SPEC.md §8.6, §9.2 Phase 2 "2.1"). Run by
-- hand with `psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -f
-- supabase/seed.sql` - as the table owner, so it bypasses RLS. Every insert
-- ends `on conflict ... do nothing`, so running this file twice is safe and
-- changes nothing the second time (CLAUDE.md §2 "seed data must be safe to
-- run twice"). `scripts/demo-reset.ts` (5.1) calls this file, then
-- `supabase/demo-data.sql` on top of it - this file is only the market
-- reference data from 2.1: mandis, crop rules, transporters, and 60 days of
-- mandi prices + today's heat colours + weather (past 60 days + next 3 days
-- forecast). The demo people, lots, bids and mega lot live in
-- `supabase/demo-data.sql`, not here.
--
-- Prices and arrivals are generated, not typed in by hand, from small fixed
-- "today" values (`hashtext(...)` gives a deterministic pseudo-random wiggle
-- from the mandi/crop/date, not `random()`) - so re-running this file always
-- produces the exact same numbers for the same calendar date. That is also
-- why every price row is written with `source = 'seed'`: it is realistic-
-- looking demo data, not a real Agmarknet report, and the prices screen
-- (2.4) must show the "Demo data" tag for it (CLAUDE.md §5 honesty rule).
--
-- Mandi names/coordinates are real Nashik-district markets. `agmarknet_name`
-- and `agmarknet_market_id` were checked against the live data.gov.in
-- resource and the Agmarknet dashboard API on 2026-09-17 when 2.3
-- (`cron-fetch-prices`) was built - the plain "Lasalgaon"/"Niphad"/
-- "Pimpalgaon" spellings guessed in 2.1 do not appear in either feed, so
-- they are fixed here to the market names/ids that actually report onion.
--
-- `do update` (not `do nothing`) on the agmarknet columns so re-running this
-- file also repairs an already-seeded cropket-dev - still idempotent, since
-- it always sets the same two values for the same id.
-- ---------------------------------------------------------------------
-- Mandis (5, all Nashik district / Maharashtra - the pilot area)
-- ---------------------------------------------------------------------
insert into mandis (id, name, district, state, location, agmarknet_name, agmarknet_market_id) values
  ('10000000-0000-0000-0000-000000000001', 'Lasalgaon', 'Nashik', 'Maharashtra',
   'SRID=4326;POINT(74.2340 20.1462)', 'Lasalgaon(Vinchur)', 3448),
  ('10000000-0000-0000-0000-000000000002', 'Pimpalgaon Baswant', 'Nashik', 'Maharashtra',
   'SRID=4326;POINT(73.9998 20.1725)', 'APMC Pimpalgaon Baswant', 162),
  ('10000000-0000-0000-0000-000000000003', 'Niphad', 'Nashik', 'Maharashtra',
   'SRID=4326;POINT(74.1116 20.0847)', 'Lasalgaon(Niphad)', 2139),
  ('10000000-0000-0000-0000-000000000004', 'Yeola', 'Nashik', 'Maharashtra',
   'SRID=4326;POINT(74.4864 20.0433)', 'APMC Yeola', 159),
  ('10000000-0000-0000-0000-000000000005', 'Chandvad', 'Nashik', 'Maharashtra',
   'SRID=4326;POINT(74.2333 20.3333)', 'APMC Chandwad', 550)
on conflict (id) do update set
  agmarknet_name = excluded.agmarknet_name,
  agmarknet_market_id = excluded.agmarknet_market_id;

-- ---------------------------------------------------------------------
-- Crop rules - copied exactly from SPEC.md §2.3
-- ---------------------------------------------------------------------
insert into crop_rules
  (crop, perishability, max_hold_days, transit_loss_pct, has_msp, msp_per_quintal_paise, floor_method)
values
  ('onion', 3, 30, 2.0, false, null, 'p20_modal_30d'),
  ('potato', 3, 45, 1.5, false, null, 'p20_modal_30d'),
  ('tomato', 9, 2, 1.0, false, null, 'p20_modal_30d')
on conflict (crop) do nothing;

-- ---------------------------------------------------------------------
-- Transporters (6, seeded mock 3PL - SPEC.md §2.1 "3PL transport: Mock")
-- ---------------------------------------------------------------------
insert into transporters (id, name, phone, rate_per_km_paise) values
  ('20000000-0000-0000-0000-000000000001', 'Om Transport', '7000000001', 1800),
  ('20000000-0000-0000-0000-000000000002', 'Shivshakti Carriers', '7000000002', 2200),
  ('20000000-0000-0000-0000-000000000003', 'Nashik Logistics', '7000000003', 2500),
  ('20000000-0000-0000-0000-000000000004', 'Godavari Roadways', '7000000004', 3000),
  ('20000000-0000-0000-0000-000000000005', 'Krishi Transport Co', '7000000005', 3800),
  ('20000000-0000-0000-0000-000000000006', 'Fast Mile Carriers', '7000000006', 4500)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 60 days x 5 mandis x 3 crops of prices (900 rows), generated so the
-- numbers are believable, deterministic and shaped for the demo:
--   - each mandi has its own general price level and market size
--     (`price_factor` / `size_factor`)
--   - all crops carry a slow, shared price wave (±5%, ~23-day period) so
--     history looks like a real series, not a flat line
--   - onion additionally rises over the last 7 days (today ≈ +6% vs a week
--     ago), so the sell/hold advice screen (2.2/2.4) has a real "price is
--     rising" case to show
--   - `arrivals_tonnes` carries a per-mandi `target_ratio`, applied to
--     *today's* arrivals only, so today's arrivals / 30-day average lands
--     close to that mandi's intended heat colour (below) - a real ratio
--     computed from the generated rows, not a hand-picked colour
-- ---------------------------------------------------------------------
with mandi_cfg (mandi_id, price_factor, size_factor, target_ratio) as (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 1.05, 1.4, 1.50), -- Lasalgaon: biggest market, busy today -> red
    ('10000000-0000-0000-0000-000000000002'::uuid, 1.00, 1.0, 1.00), -- Pimpalgaon: normal -> yellow
    ('10000000-0000-0000-0000-000000000003'::uuid, 0.97, 0.7, 0.55), -- Niphad: quiet today -> green
    ('10000000-0000-0000-0000-000000000004'::uuid, 0.95, 0.9, 1.10), -- Yeola: a bit busy -> yellow
    ('10000000-0000-0000-0000-000000000005'::uuid, 0.93, 0.6, 0.85)  -- Chandvad: a bit quiet -> yellow
),
crop_cfg (crop, base_price_rupees, base_arrivals_tonnes) as (
  values
    ('onion', 1800, 300),
    ('tomato', 1200, 150),
    ('potato', 1100, 120)
),
today (d) as (
  select (now() at time zone 'Asia/Kolkata')::date
),
raw as (
  select
    mc.mandi_id,
    cc.crop,
    t.d - g.days_ago as date,
    cc.base_price_rupees * mc.price_factor * (
      1
      + 0.05 * sin(2 * pi() * g.days_ago / 23.0)
      + case when cc.crop = 'onion' and g.days_ago <= 6 then (6 - g.days_ago) * 0.01 else 0 end
      + ((((hashtext(mc.mandi_id::text || cc.crop || (t.d - g.days_ago)::text || 'price') & 2147483647)::numeric
           / 2147483647.0) - 0.5) * 0.06)
    ) as modal_rupees,
    cc.base_arrivals_tonnes * mc.size_factor
      * (case when g.days_ago = 0 then mc.target_ratio else 1 end)
      * (1 + ((((hashtext(mc.mandi_id::text || cc.crop || (t.d - g.days_ago)::text || 'arr') & 2147483647)::numeric
                / 2147483647.0) - 0.5) * 0.04)
        ) as arrivals_tonnes
  from mandi_cfg mc
  cross join crop_cfg cc
  cross join generate_series(0, 59) as g (days_ago)
  cross join today t
)
insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
select
  mandi_id,
  crop,
  date,
  round(modal_rupees * 100 * 0.88)::bigint,
  round(modal_rupees * 100 * 1.12)::bigint,
  round(modal_rupees * 100)::bigint,
  round(arrivals_tonnes::numeric, 1),
  'seed'
from raw
on conflict (mandi_id, crop, date) do nothing;

-- ---------------------------------------------------------------------
-- Today's mandi_heat, computed from the arrivals just inserted above -
-- the real SPEC.md §2.4 formula (today / 30-day trailing average), not a
-- hand-picked colour. `cron-fetch-prices` (2.3) recomputes this the same
-- way every day (via the `mandi_heat_inputs()` SQL function added in
-- 20260917125931_agmarknet_link.sql); this seed just gives day one a value
-- before that cron has run.
--
-- `arrivals_tonnes is not null` on both sides mirrors that function's own
-- guard: once a real `agmarknet` price has landed for today with unknown
-- arrivals (data.gov.in has no arrivals column), skipping it here is what
-- keeps this insert safe to run twice (CLAUDE.md §2 "seed data must be safe
-- to run twice") - without it, `mp.arrivals_tonnes / avg_30.avg_arrivals`
-- computes on a null and the not-null `ratio` column rejects the row.
-- ---------------------------------------------------------------------
insert into mandi_heat (mandi_id, crop, date, ratio, colour)
select
  mp.mandi_id,
  mp.crop,
  mp.date,
  round(mp.arrivals_tonnes / nullif(avg_30.avg_arrivals, 0), 3),
  case
    when mp.arrivals_tonnes / nullif(avg_30.avg_arrivals, 0) > 1.3 then 'red'
    when mp.arrivals_tonnes / nullif(avg_30.avg_arrivals, 0) < 0.8 then 'green'
    else 'yellow'
  end
from mandi_prices mp
join lateral (
  select avg(hist.arrivals_tonnes) as avg_arrivals
  from mandi_prices hist
  where hist.mandi_id = mp.mandi_id
    and hist.crop = mp.crop
    and hist.date < mp.date
    and hist.date >= mp.date - 30
    and hist.arrivals_tonnes is not null
) avg_30 on true
where mp.date = (now() at time zone 'Asia/Kolkata')::date
  and mp.arrivals_tonnes is not null
on conflict (mandi_id, crop, date) do nothing;

-- ---------------------------------------------------------------------
-- Weather: 60 days of history + 3 days forecast, Nashik district only
-- (the only district farmers are onboarded into in the prototype - 1.1).
-- Rain is seeded on 2 of the next 3 days, so the "rain expected" up-signal
-- in the sell/hold advice (2.2) has a real case to fire, matching the
-- §4.8 wireframe's "Why: rain expected, fewer trucks arriving."
-- ---------------------------------------------------------------------
with today (d) as (
  select (now() at time zone 'Asia/Kolkata')::date
)
insert into weather_daily (district, date, rain_mm, temp_max, fetched_at)
select
  'Nashik',
  t.d + g.day_offset,
  case
    when g.day_offset = 1 then 14.0
    when g.day_offset = 3 then 11.0
    else round(
      (((hashtext('Nashik-rain-' || (t.d + g.day_offset)::text) & 2147483647)::numeric / 2147483647.0) * 6.0)::numeric,
      1
    )
  end,
  round(
    (26 + ((hashtext('Nashik-temp-' || (t.d + g.day_offset)::text) & 2147483647)::numeric / 2147483647.0) * 8.0)::numeric,
    1
  ),
  now()
from today t
cross join generate_series(-59, 3) as g (day_offset)
on conflict (district, date) do nothing;
