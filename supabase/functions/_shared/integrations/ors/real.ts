// Calls OpenRouteService's Matrix API (SPEC.md §5.4 `route-distance`) - one
// request for every destination at once, not N separate directions calls.
// Honesty rule (CLAUDE.md §5): a set key whose call fails 502s, it never
// quietly falls back to the mock.
import type { RouteLeg } from "../../domain/schemas/route.ts";
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";
import type { RouteDistanceInput } from "./types.ts";

const MATRIX_URL = "https://api.openrouteservice.org/v2/matrix/driving-car";

// ORS wants [lng, lat] - the opposite of how LatLng is written everywhere
// else in this codebase (the same trap geo.ts's toPointWKT() documents).
// This is the only place that flips the order.
function toLngLat(point: { lat: number; lng: number }): [number, number] {
  return [point.lng, point.lat];
}

export async function routeDistance(input: RouteDistanceInput): Promise<RouteLeg[]> {
  const apiKey = requireEnv("ORS_API_KEY");
  const locations = [input.from, ...input.to].map(toLngLat);
  const destinations = input.to.map((_, i) => i + 1);

  let res: Response;
  try {
    res = await fetch(MATRIX_URL, {
      method: "POST",
      headers: { authorization: apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        locations,
        sources: [0],
        destinations,
        metrics: ["distance", "duration"],
        units: "km",
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new AppError("ROUTE_UNAVAILABLE", 502, err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) throw new AppError("ROUTE_UNAVAILABLE", 502, `ORS returned ${res.status}`);

  const body = (await res.json()) as { distances?: number[][]; durations?: number[][] };
  const distances = body.distances?.[0];
  const durations = body.durations?.[0];
  if (!distances || !durations || distances.length !== input.to.length) {
    throw new AppError("ROUTE_UNAVAILABLE", 502, "ORS returned an unexpected matrix shape");
  }

  return distances.map((km, i) => ({ km, minutes: durations[i] / 60, source: "ors" as const }));
}
