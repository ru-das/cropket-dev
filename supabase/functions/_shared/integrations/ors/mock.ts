// Straight-line stand-in for OpenRouteService when ORS_API_KEY is missing
// (SPEC.md §9.5 "straight line × 1.3 (mock)"). Same `straightLineRoute()`
// the app's offline fallback uses (services/routes.ts) - one fudge factor,
// not two copies that could drift apart.
import type { RouteLeg } from "../../domain/schemas/route.ts";
import { straightLineRoute } from "../../domain/geo.ts";
import type { RouteDistanceInput } from "./types.ts";

export function routeDistance(input: RouteDistanceInput): Promise<RouteLeg[]> {
  return Promise.resolve(
    input.to.map((dest) => ({ ...straightLineRoute(input.from, dest), source: "mock" as const })),
  );
}
