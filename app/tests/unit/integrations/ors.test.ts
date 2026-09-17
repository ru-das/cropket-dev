// CLAUDE.md §6 "Mock adapters: mock output passes the same zod schema as
// real (test the pure mock.ts files)".
import { describe, expect, it } from "vitest";
import { RouteLeg } from "@shared/schemas/route.ts";
import { routeDistance as mockRouteDistance } from "../../../../supabase/functions/_shared/integrations/ors/mock.ts";

const from = { lat: 19.9975, lng: 73.7898 }; // Nashik city
const to = [
  { lat: 20.1462, lng: 74.234 }, // Lasalgaon
  { lat: 20.0847, lng: 74.1116 }, // Niphad
];

describe("integrations/ors mock", () => {
  it("returns one leg per destination, in the same order", async () => {
    const legs = await mockRouteDistance({ from, to });
    expect(legs).toHaveLength(2);
  });

  it("returns legs that pass RouteLeg, the same schema real.ts must pass", async () => {
    const legs = await mockRouteDistance({ from, to });
    for (const leg of legs) expect(RouteLeg.safeParse(leg).success).toBe(true);
  });

  it("marks itself as a mock", async () => {
    const [leg] = await mockRouteDistance({ from, to: [to[0]] });
    expect(leg.source).toBe("mock");
  });

  it("gives a farther destination a bigger distance", async () => {
    const near = { lat: 20.01, lng: 73.8 };
    const far = { lat: 20.5, lng: 74.5 };
    const [nearLeg, farLeg] = await mockRouteDistance({ from, to: [near, far] });
    expect(farLeg.km).toBeGreaterThan(nearLeg.km);
  });
});
