// SPEC.md §4.10 marketplace filters. `filterAndSortLots` is pure - the one
// bug worth guarding is a lot with no GPS silently vanishing (kept, unless
// there's a distance filter) or nearest-sort crashing on it (sorts last).
import { describe, expect, it } from "vitest";
import { filterAndSortLots, DEFAULT_MARKET_FILTERS, type MarketLot } from "@/routes/buyer/marketplace";

const NIPHAD = { lat: 20.0847, lng: 74.1116 };
const LASALGAON = { lat: 20.1462, lng: 74.234 }; // ~13.5 km from Niphad

function lot(overrides: Partial<MarketLot>): MarketLot {
  return {
    id: "lot-1",
    kind: "lot",
    crop: "onion",
    grade: "A",
    quantityKg: 500,
    gradeResultId: "gr-1",
    farmerCount: null,
    location: NIPHAD,
    createdAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

function megaLot(overrides: Partial<MarketLot>): MarketLot {
  return lot({
    id: "mega-1",
    kind: "mega",
    gradeResultId: null,
    farmerCount: 4,
    quantityKg: 600,
    ...overrides,
  });
}

describe("filterAndSortLots", () => {
  it("returns everything unfiltered, unchanged order, when nothing is set", () => {
    const lots = [lot({ id: "a" }), lot({ id: "b" })];
    expect(filterAndSortLots(lots, DEFAULT_MARKET_FILTERS, null).map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("filters by crop", () => {
    const lots = [lot({ id: "onion-lot", crop: "onion" }), lot({ id: "tomato-lot", crop: "tomato" })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, crop: "tomato" }, null);
    expect(result.map((l) => l.id)).toEqual(["tomato-lot"]);
  });

  it("filters by a subset of grades", () => {
    const lots = [lot({ id: "a", grade: "A" }), lot({ id: "b", grade: "B" }), lot({ id: "c", grade: "C" })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, grades: ["A", "B"] }, null);
    expect(result.map((l) => l.id).sort()).toEqual(["a", "b"]);
  });

  it("treats an empty grade list as any grade", () => {
    const lots = [lot({ id: "a", grade: "A" }), lot({ id: "c", grade: "C" })];
    expect(filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, grades: [] }, null)).toHaveLength(2);
  });

  it("filters by minimum quantity, boundary inclusive", () => {
    const lots = [lot({ id: "small", quantityKg: 400 }), lot({ id: "big", quantityKg: 500 })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, minKg: 500 }, null);
    expect(result.map((l) => l.id)).toEqual(["big"]);
  });

  it("drops a lot farther than maxKm", () => {
    const lots = [lot({ id: "near", location: NIPHAD }), lot({ id: "far", location: { lat: 21.5, lng: 75.5 } })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, maxKm: 20 }, NIPHAD);
    expect(result.map((l) => l.id)).toEqual(["near"]);
  });

  it("drops a lot with no location once a distance filter is set - can't prove it's near", () => {
    const lots = [lot({ id: "known", location: NIPHAD }), lot({ id: "unknown", location: null })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, maxKm: 50 }, NIPHAD);
    expect(result.map((l) => l.id)).toEqual(["known"]);
  });

  it("keeps a lot with no location when no distance filter is set", () => {
    const lots = [lot({ id: "unknown", location: null })];
    expect(filterAndSortLots(lots, DEFAULT_MARKET_FILTERS, NIPHAD)).toHaveLength(1);
  });

  it("sorts nearest-first, with a null-km lot last", () => {
    const lots = [
      lot({ id: "far", location: LASALGAON, createdAt: "2026-09-18T00:00:00.000Z" }),
      lot({ id: "unknown", location: null, createdAt: "2026-09-22T00:00:00.000Z" }),
      lot({ id: "near", location: NIPHAD, createdAt: "2026-09-19T00:00:00.000Z" }),
    ];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, sort: "nearest" }, NIPHAD);
    expect(result.map((l) => l.id)).toEqual(["near", "far", "unknown"]);
  });

  it("falls back to newest-first when sort is nearest but the buyer has no location", () => {
    const lots = [
      lot({ id: "older", createdAt: "2026-09-18T00:00:00.000Z" }),
      lot({ id: "newer", createdAt: "2026-09-20T00:00:00.000Z" }),
    ];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, sort: "nearest" }, null);
    expect(result.map((l) => l.id)).toEqual(["newer", "older"]);
  });

  it("sorts newest-first by default", () => {
    const lots = [
      lot({ id: "older", createdAt: "2026-09-18T00:00:00.000Z" }),
      lot({ id: "newer", createdAt: "2026-09-20T00:00:00.000Z" }),
    ];
    expect(filterAndSortLots(lots, DEFAULT_MARKET_FILTERS, null).map((l) => l.id)).toEqual(["newer", "older"]);
  });

  it("returns an empty list for an empty input", () => {
    expect(filterAndSortLots([], DEFAULT_MARKET_FILTERS, NIPHAD)).toEqual([]);
  });

  it("includes a mega lot by default, passing the same filters as a single lot", () => {
    const lots = [lot({ id: "small" }), megaLot({ id: "mega", crop: "tomato" })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, crop: "tomato" }, null);
    expect(result.map((l) => l.id)).toEqual(["mega"]);
  });

  it("drops mega lots when the mega lots filter is off, keeping single lots", () => {
    const lots = [lot({ id: "small" }), megaLot({ id: "mega" })];
    const result = filterAndSortLots(lots, { ...DEFAULT_MARKET_FILTERS, megaLots: false }, null);
    expect(result.map((l) => l.id)).toEqual(["small"]);
  });
});
