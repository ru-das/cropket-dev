// Shapes for the `route-distance` Edge Function (SPEC.md §5.4) and its
// `integrations/ors` adapter. Pure TypeScript + zod only (CLAUDE.md §4
// "shared domain code").
import { z } from "zod";
import { LatLng } from "../geo.ts";

// The comparator screen (2.5) only ever asks about the 5 Nashik mandis -
// .max(10) is the trust boundary, matched to ORS's free matrix tier
// (500 calls/day), not a real screen need.
export const RouteRequest = z.object({
  from: LatLng,
  to: z.array(LatLng).min(1).max(10),
});
export type RouteRequest = z.infer<typeof RouteRequest>;

// One leg's answer, in the caller's `to[]` order. `source` so both
// integrations/ors/mock.ts and real.ts are validated against the same
// schema (CLAUDE.md §5 "validate results with zod in both mock and real
// mode").
export const RouteLeg = z.object({
  km: z.number().min(0),
  minutes: z.number().min(0),
  source: z.enum(["ors", "mock"]),
});
export type RouteLeg = z.infer<typeof RouteLeg>;
