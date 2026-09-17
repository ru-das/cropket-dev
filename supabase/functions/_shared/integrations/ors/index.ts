// The only file other code imports for road distance (SPEC.md §2.2). Picks
// mock or real and validates every leg against RouteLeg either way
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
import { z } from "zod";
import { RouteLeg } from "../../domain/schemas/route.ts";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";
import type { RouteDistanceInput } from "./types.ts";

export type { RouteDistanceInput };

export async function routeDistance(input: RouteDistanceInput): Promise<RouteLeg[]> {
  const impl = isMock("ors", ["ORS_API_KEY"]) ? mock : real;
  const legs = await impl.routeDistance(input);
  return z.array(RouteLeg).parse(legs);
}
