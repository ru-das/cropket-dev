// A GPS point and its PostGIS text form (SPEC.md §5.6 `profiles.location
// geography(Point, 4326)`). Pure TypeScript + zod only (CLAUDE.md §4 "shared
// domain code") - used by onboarding (1.1) today, and by create-lot (1.6)
// and Net-₹ (M2) later for the same column shape.
import { z } from "zod";

const EARTH_RADIUS_KM = 6371;

export const LatLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type LatLng = z.infer<typeof LatLng>;

/**
 * PostGIS reads WKT as "POINT(lng lat)" - longitude first, the opposite
 * order from how people say "lat, lng" out loud. Getting this backwards
 * silently puts a Nashik farmer's pin in the Bay of Bengal, so this is the
 * only place that writes the string - everyone else passes a LatLng in.
 */
export function toPointWKT({ lat, lng }: LatLng): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Straight-line distance between two points, in km (SPEC.md §2.4 the mock
 * Net-₹ transport distance is "straight line × 1.3" when ORS has no key -
 * this is that straight line). Used by the prices screen (2.4) to rank
 * mandis by distance for a perishable crop's "nearest" hero pick.
 *
 * ponytail: straight-line km, not road time - a short bad road can take
 * longer than a long good one. `route-distance` (2.5) is real road distance
 * from ORS; swap the ranking key there if travel time ever needs to beat
 * straight-line distance for picking the hero mandi.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// SPEC.md §9.5 "road distance ... else straight line × 1.3 (mock)" - a
// straight road never exists, so a fixed detour factor stands in for real
// road geometry when ORS has no key. Used by `integrations/ors/mock.ts`
// (2.5) and by the app's offline fallback in `services/routes.ts`, so the
// exact same number is on screen whether the mock ran on the server or on
// the phone.
export const ROAD_DETOUR_FACTOR = 1.3;

// SPEC.md has no number for mock *travel time* (only distance) - a rural
// Maharashtra state-highway average stands in until ORS gives a real one.
export const RURAL_SPEED_KMH = 30;

/**
 * The mock road distance/time between two points: haversine × the detour
 * factor, at a fixed rural speed. Pure function so `integrations/ors/mock.ts`
 * (server) and the app's offline comparator fallback (2.5) share one
 * implementation instead of two copies of the same fudge factor drifting
 * apart.
 */
export function straightLineRoute(a: LatLng, b: LatLng): { km: number; minutes: number } {
  const km = haversineKm(a, b) * ROAD_DETOUR_FACTOR;
  return { km, minutes: (km / RURAL_SPEED_KMH) * 60 };
}
