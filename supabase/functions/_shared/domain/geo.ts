// A GPS point and its PostGIS text form (SPEC.md §5.6 `profiles.location
// geography(Point, 4326)`). Pure TypeScript + zod only (CLAUDE.md §4 "shared
// domain code") - used by onboarding (1.1) today, and by create-lot (1.6)
// and Net-₹ (M2) later for the same column shape.
import { z } from "zod";

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
