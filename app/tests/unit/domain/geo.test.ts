// SPEC.md §5.6 `profiles.location geography(Point, 4326)`. CLAUDE.md §6
// "Formulas in SPEC.md §2.4, edge cases (zero, missing data)" - the one bug
// this file exists to catch is lng/lat swapped, which silently moves a
// Nashik farmer's pin into the sea.
import { describe, expect, it } from "vitest";
import {
  LatLng,
  haversineKm,
  straightLineRoute,
  toPointWKT,
  ROAD_DETOUR_FACTOR,
  RURAL_SPEED_KMH,
} from "@shared/geo.ts";

describe("toPointWKT", () => {
  it("puts longitude before latitude, as PostGIS expects", () => {
    // Niphad, Nashik: lat ~20.0 N, lng ~73.79 E - very different numbers,
    // so a swap is easy to catch.
    expect(toPointWKT({ lat: 20.0, lng: 73.79 })).toBe("SRID=4326;POINT(73.79 20)");
  });

  it("handles negative coordinates", () => {
    expect(toPointWKT({ lat: -33.87, lng: 151.21 })).toBe("SRID=4326;POINT(151.21 -33.87)");
  });

  it("handles zero coordinates (Gulf of Guinea, but a valid point)", () => {
    expect(toPointWKT({ lat: 0, lng: 0 })).toBe("SRID=4326;POINT(0 0)");
  });
});

describe("LatLng", () => {
  it("accepts a real point", () => {
    expect(LatLng.safeParse({ lat: 20.0, lng: 73.79 }).success).toBe(true);
  });

  it("accepts the boundary values", () => {
    expect(LatLng.safeParse({ lat: 90, lng: 180 }).success).toBe(true);
    expect(LatLng.safeParse({ lat: -90, lng: -180 }).success).toBe(true);
  });

  it("rejects a latitude above 90", () => {
    expect(LatLng.safeParse({ lat: 90.1, lng: 0 }).success).toBe(false);
  });

  it("rejects a longitude below -180", () => {
    expect(LatLng.safeParse({ lat: 0, lng: -180.1 }).success).toBe(false);
  });
});

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm({ lat: 20.0847, lng: 74.1116 }, { lat: 20.0847, lng: 74.1116 })).toBe(0);
  });

  it("matches the known straight-line distance between two Nashik mandis", () => {
    // Lasalgaon (20.1462, 74.2340) to Niphad (20.0847, 74.1116) -
    // Google Earth's ruler gives ~13.5 km for this pair.
    const km = haversineKm({ lat: 20.1462, lng: 74.234 }, { lat: 20.0847, lng: 74.1116 });
    expect(km).toBeGreaterThan(12);
    expect(km).toBeLessThan(15);
  });

  it("is symmetric", () => {
    const a = { lat: 20.1462, lng: 74.234 };
    const b = { lat: 20.0433, lng: 74.4864 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe("straightLineRoute", () => {
  const a = { lat: 20.1462, lng: 74.234 };
  const b = { lat: 20.0847, lng: 74.1116 };

  it("is zero for the same point", () => {
    expect(straightLineRoute(a, a)).toEqual({ km: 0, minutes: 0 });
  });

  it("is haversine distance x the detour factor", () => {
    expect(straightLineRoute(a, b).km).toBeCloseTo(haversineKm(a, b) * ROAD_DETOUR_FACTOR, 10);
  });

  it("derives minutes from the rural speed constant", () => {
    const { km, minutes } = straightLineRoute(a, b);
    expect(minutes).toBeCloseTo((km / RURAL_SPEED_KMH) * 60, 10);
  });
});
