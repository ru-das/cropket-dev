// Road distance/time to a list of mandis (SPEC.md §5.4 `route-distance`,
// §9.2 Phase 2 "2.5") - the input the Net-₹ comparator (services/prices.ts)
// needs alongside a mandi's price. Calls the Edge Function through
// callFunction (CLAUDE.md §3 "data access from the app goes through
// services/* only"); when that fails (offline, or never called while
// online) falls back to the same straightLineRoute() the function's own
// mock uses, so the comparator always has a number to show.
import { useQuery } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import { straightLineRoute } from "@shared/geo.ts";
import type { LatLng } from "@shared/geo.ts";
import type { RouteLeg } from "@shared/schemas/route.ts";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Rounded to a stable, JSON-serialisable query key - not the DB cache's
// rounding (route-distance/index.ts does that server-side), just enough
// precision that the same farm/mandi pair always produces the same key.
function keyOf(p: LatLng): string {
  return `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
}

async function fetchRouteDistances(from: LatLng, to: LatLng[]): Promise<RouteLeg[]> {
  const { legs } = await callFunction<{ legs: RouteLeg[] }>("route-distance", { from, to });
  return legs;
}

export const routeKeys = {
  distances: (from: LatLng, to: LatLng[]) =>
    ["routes", keyOf(from), to.map(keyOf).join("|")] as const,
};

/**
 * One leg per `to[]` destination, in the same order. `null` while there is
 * no farmer location to route from yet (SPEC.md §4.9 "no saved farmer
 * location -> no distances").
 */
export function useRouteDistances(from: LatLng | null, to: LatLng[]) {
  const query = useQuery({
    queryKey: from ? routeKeys.distances(from, to) : ["routes", "none"],
    queryFn: () => fetchRouteDistances(from as LatLng, to),
    enabled: from !== null && to.length > 0,
    staleTime: TWENTY_FOUR_HOURS_MS, // matches route_cache's own 24 h lifetime
  });

  // A real answer (this session or a saved one from IndexedDB) always wins.
  // Only when there is truly nothing yet - first load, offline, no key set
  // - do we compute the same straight-line mock the function itself would
  // have returned, so the table never sits empty.
  const legs: RouteLeg[] | null =
    query.data ??
    (from
      ? to.map((dest) => ({ ...straightLineRoute(from, dest), source: "mock" as const }))
      : null);

  return { legs, dataUpdatedAt: query.dataUpdatedAt, isFetching: query.isFetching };
}
