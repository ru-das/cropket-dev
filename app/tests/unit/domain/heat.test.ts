// SPEC.md §2.4 heatmap colour. Boundaries must match supabase/seed.sql's
// SQL version of this same formula exactly (see heat.ts's header comment).
import { describe, expect, it } from "vitest";
import { heatColour, heatRatio } from "@shared/heat.ts";

describe("heatColour", () => {
  it("1.3 is yellow, not red - the boundary is exclusive", () => {
    expect(heatColour(1.3)).toBe("yellow");
  });

  it("1.31 is red", () => {
    expect(heatColour(1.31)).toBe("red");
  });

  it("0.8 is yellow, not green - the boundary is exclusive", () => {
    expect(heatColour(0.8)).toBe("yellow");
  });

  it("0.79 is green", () => {
    expect(heatColour(0.79)).toBe("green");
  });

  it("1.0 (exactly average) is yellow", () => {
    expect(heatColour(1.0)).toBe("yellow");
  });
});

describe("heatRatio", () => {
  it("matches arrivals / 30-day average when there are no nearby Digital Lots", () => {
    expect(heatRatio({ arrivalsTonnes: 130, avgArrivals30dTonnes: 100 })).toBe(1.3);
  });

  it("nearby Digital Lots raise the ratio", () => {
    const withoutLots = heatRatio({ arrivalsTonnes: 80, avgArrivals30dTonnes: 100 });
    const withLots = heatRatio({
      arrivalsTonnes: 80,
      avgArrivals30dTonnes: 100,
      nearbyLotTonnes: 20,
    });
    expect(withLots).toBeGreaterThan(withoutLots as number);
    expect(withLots).toBe(1.0);
  });

  it("returns null when the 30-day average is zero, instead of dividing to Infinity", () => {
    expect(heatRatio({ arrivalsTonnes: 50, avgArrivals30dTonnes: 0 })).toBeNull();
  });
});
