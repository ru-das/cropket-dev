// SPEC.md §5.6 `profiles.location geography(Point, 4326)`. CLAUDE.md §6
// "Formulas in SPEC.md §2.4, edge cases (zero, missing data)" - the one bug
// this file exists to catch is lng/lat swapped, which silently moves a
// Nashik farmer's pin into the sea.
import { describe, expect, it } from "vitest";
import { LatLng, toPointWKT } from "@shared/geo.ts";

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
