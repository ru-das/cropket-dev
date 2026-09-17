-- Links `mandis` to the Agmarknet market ids that cron-fetch-prices (2.3)
-- fetches from, and adds the SQL half of the SPEC.md §2.4 heat formula.
--
-- Two live-checked facts drove this (see the 2.3 plan):
-- - data.gov.in's daily-price resource has no arrivals column at all, so a
--   real price row can land with unknown arrivals. `arrivals_tonnes` moves
--   from not-null to nullable rather than storing a guessed number next to
--   `source = 'agmarknet'` (CLAUDE.md §5 honesty rule - never invent data
--   under a "real" label).
-- - the price feed (data.gov.in) and the arrivals feed (an Agmarknet
--   dashboard API) key markets differently: data.gov.in only has a name
--   string, the Agmarknet API wants a numeric market id. `agmarknet_name`
--   already covers the first; `agmarknet_market_id` is the second.

alter table mandis add column agmarknet_market_id int unique;

alter table mandi_prices alter column arrivals_tonnes drop not null;
-- the arrivals_tonnes >= 0 check already allows null (Postgres check
-- constraints pass on null automatically), so nothing else changes here.

-- Aggregates the three numbers heat.ts (2.2) needs to compute one mandi/crop
-- day's ratio: today's arrivals, the trailing 30-day average, and nearby
-- Digital Lots (SPEC.md §2.4 "expected_today = govt arrivals + our Digital
-- Lots within 50 km in last 24 h"). The ratio itself and the 1.3 / 0.8
-- colour thresholds are NOT computed here - they stay in the already-tested
-- `heatRatio()` / `heatColour()` (CLAUDE.md §3: pure calculations live in
-- `_shared/domain/`, not SQL). This function only gathers inputs.
--
-- `security definer` so cron-fetch-prices (service role) can read `lots`
-- across every farmer, same as escrow/grade functions already do; revoked
-- from client roles below so a browser can never call it directly.
-- `search_path` includes `extensions` (not just `public`) because this is
-- the first `security definer` function to call a PostGIS function
-- (`st_dwithin`) - on cropket-dev postgis is installed into `extensions`,
-- not `public`, and a locked-down search_path only resolves names inside
-- the schemas it lists.
create function mandi_heat_inputs(p_date date)
returns table (
  mandi_id uuid,
  crop text,
  arrivals_tonnes numeric,
  avg_arrivals_30d numeric,
  nearby_lot_tonnes numeric
)
language sql
security definer
stable
set search_path = public, extensions
as $$
  select
    mp.mandi_id,
    mp.crop,
    mp.arrivals_tonnes,
    avg_30.avg_arrivals,
    coalesce(nearby.tonnes, 0)
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
  join mandis m on m.id = mp.mandi_id
  left join lateral (
    -- "last 24 h" = the IST calendar day of p_date, matching how
    -- mandi_prices.date/mandi_heat.date are themselves stamped
    -- ((now() at time zone 'Asia/Kolkata')::date, see seed.sql) - a
    -- calendar-day window is deterministic (testable without mocking the
    -- clock) and close enough to a rolling 24 h for a once-a-day cron.
    select sum(l.quantity_kg) / 1000.0 as tonnes
    from lots l
    where l.crop = mp.crop
      and l.created_at >= (mp.date::timestamp at time zone 'Asia/Kolkata')
      and l.created_at < ((mp.date + 1)::timestamp at time zone 'Asia/Kolkata')
      and st_dwithin(l.location, m.location, 50000)
  ) nearby on true
  where mp.date = p_date
    and mp.arrivals_tonnes is not null;
$$;

revoke all on function mandi_heat_inputs(date) from public, anon, authenticated;
