-- route_cache: a 24 h server-side cache of OpenRouteService road-distance
-- results (SPEC.md §5.4 `route-distance`, §5.6 "Results cached for 24 h in
-- route_cache"). Written and read only by the `route-distance` Edge
-- Function (service role) - never by the client (CLAUDE.md §3 "anything
-- with a secret or an outside API call is an Edge Function").
--
-- Two deliberate deviations from SPEC.md §5.6's
-- `from_hash, to_hash, km, minutes, alternatives (jsonb), fetched_at`,
-- fixed here in the same commit (CLAUDE.md §0 rule 3):
--   - Rounded coordinate columns instead of hashed ones - no hashing code
--     needed, and the table stays readable when debugging a distance
--     ("why is Lasalgaon 41 km?"). numeric(8,3) is ~110 m buckets, well
--     under farm-GPS jitter (10-50 m), so the same farm/mandi pair always
--     lands on the same cache row.
--   - No `alternatives` column: alternative routes only feed P2 risk-aware
--     route scoring (SPEC.md §9.2 Phase 2), not built in the prototype. An
--     always-null column is dead weight the team would have to explain.
--
-- Only real ORS results are ever written here (route-distance/index.ts) -
-- a mock (straight-line) result is free to recompute, and caching it would
-- freeze the "Demo data" tag in place even after ORS_API_KEY is added.

create table route_cache (
  from_lat numeric(8, 3) not null,
  from_lng numeric(8, 3) not null,
  to_lat numeric(8, 3) not null,
  to_lng numeric(8, 3) not null,
  km numeric not null check (km >= 0),
  minutes numeric not null check (minutes >= 0),
  fetched_at timestamptz not null default now(),
  primary key (from_lat, from_lng, to_lat, to_lng)
);

alter table route_cache enable row level security;

-- No policies at all - the client never reads or writes this table, only
-- `route-distance` (service role, `_shared/db.ts`), the same "no client
-- access whatsoever" shape as `escrows`/`escrow_events`/`payouts`
-- (CLAUDE.md §4).
revoke all on route_cache from anon, authenticated;
