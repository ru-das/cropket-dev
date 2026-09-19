// Pure helpers behind services/prices.ts (SPEC.md §4.8, §9.2 Phase 2 "2.4
// Prices screen") - same pattern as lots.test.ts/grading.test.ts: test the
// pure half, leave the Supabase round trip in fetchMarketSnapshot() thin
// and untested directly.
import { describe, expect, it } from "vitest";
import {
  buildAdviceInput,
  buildComparisonRows,
  isDemoPrice,
  latestPerMandi,
  mandisWithCoords,
  pickHeroMandi,
  type MandiPrice,
  type RoutableMandiPrice,
} from "@/services/prices";
import type { RouteLeg } from "@shared/schemas/route.ts";

const LASALGAON = { id: "n1", name: "Lasalgaon", lat: 20.1462, lng: 74.234 };
const NIPHAD = { id: "n2", name: "Niphad", lat: 20.0847, lng: 74.1116 };

function mandiPrice(overrides: Partial<MandiPrice> & { mandi: MandiPrice["mandi"] }): MandiPrice {
  return {
    todayModalPricePaise: 100000,
    yesterdayModalPricePaise: null,
    isDemo: false,
    heat: null,
    priceDate: "2026-09-19",
    isStale: false,
    ...overrides,
  };
}

describe("latestPerMandi", () => {
  it("keeps the newest-dated row per mandi", () => {
    const rows = [
      { mandi_id: "a", date: "2026-09-10", n: 1 },
      { mandi_id: "a", date: "2026-09-15", n: 2 },
      { mandi_id: "b", date: "2026-09-12", n: 3 },
    ];
    const out = latestPerMandi(rows);
    expect(out.get("a")?.n).toBe(2);
    expect(out.get("b")?.n).toBe(3);
  });

  it("is order-independent", () => {
    const rows = [
      { mandi_id: "a", date: "2026-09-15", n: 2 },
      { mandi_id: "a", date: "2026-09-10", n: 1 },
    ];
    expect(latestPerMandi(rows).get("a")?.n).toBe(2);
  });
});

describe("isDemoPrice", () => {
  it("a real agmarknet price is not demo", () => {
    expect(isDemoPrice("agmarknet")).toBe(false);
  });

  it("seeded history and a keyless mock day are demo", () => {
    expect(isDemoPrice("seed")).toBe(true);
    expect(isDemoPrice("mock")).toBe(true);
  });
});

describe("pickHeroMandi", () => {
  it("returns null with no mandi prices", () => {
    expect(pickHeroMandi({ mandiPrices: [], perishability: 3, farmerLocation: null })).toBeNull();
  });

  it("picks best price for a non-perishable crop (onion, perishability 3) even with a saved location", () => {
    const cheaper = mandiPrice({ mandi: LASALGAON, todayModalPricePaise: 90000 });
    const dearer = mandiPrice({ mandi: NIPHAD, todayModalPricePaise: 95000 });
    const result = pickHeroMandi({
      mandiPrices: [cheaper, dearer],
      perishability: 3,
      farmerLocation: { lat: 20.1, lng: 74.1 },
    });
    expect(result?.mandi.id).toBe(NIPHAD.id);
    expect(result?.reason).toBe("bestPrice");
  });

  it("picks the nearest mandi for a highly perishable crop (tomato, perishability 9)", () => {
    const near = mandiPrice({ mandi: NIPHAD, todayModalPricePaise: 80000 });
    const far = mandiPrice({ mandi: LASALGAON, todayModalPricePaise: 120000 });
    const result = pickHeroMandi({
      mandiPrices: [near, far],
      perishability: 9,
      farmerLocation: { lat: NIPHAD.lat, lng: NIPHAD.lng }, // standing right at Niphad
    });
    expect(result?.mandi.id).toBe(NIPHAD.id);
    expect(result?.reason).toBe("nearest");
  });

  it("falls back to best price for a perishable crop when the farmer has no saved location", () => {
    const near = mandiPrice({ mandi: NIPHAD, todayModalPricePaise: 80000 });
    const dearer = mandiPrice({ mandi: LASALGAON, todayModalPricePaise: 120000 });
    const result = pickHeroMandi({
      mandiPrices: [near, dearer],
      perishability: 9,
      farmerLocation: null,
    });
    expect(result?.mandi.id).toBe(LASALGAON.id);
    expect(result?.reason).toBe("bestPrice");
  });
});

describe("buildAdviceInput", () => {
  it("averages price and arrivals across mandis per day, oldest first", () => {
    const rows = [
      {
        mandi_id: "a",
        crop: "onion",
        date: "2026-09-02",
        min_price_paise: 0,
        max_price_paise: 0,
        modal_price_paise: 100,
        arrivals_tonnes: 10,
        source: "seed",
      },
      {
        mandi_id: "b",
        crop: "onion",
        date: "2026-09-02",
        min_price_paise: 0,
        max_price_paise: 0,
        modal_price_paise: 200,
        arrivals_tonnes: 20,
        source: "seed",
      },
      {
        mandi_id: "a",
        crop: "onion",
        date: "2026-09-01",
        min_price_paise: 0,
        max_price_paise: 0,
        modal_price_paise: 50,
        arrivals_tonnes: 5,
        source: "seed",
      },
    ];
    const out = buildAdviceInput(rows);
    expect(out.map((d) => d.date)).toEqual(["2026-09-01", "2026-09-02"]);
    expect(out[1].modalPricePaise).toBe(150); // (100+200)/2
    expect(out[1].arrivalsTonnes).toBe(15); // (10+20)/2
  });

  it("ignores a null-arrivals row (a real agmarknet price with unknown arrivals) when averaging", () => {
    const rows = [
      {
        mandi_id: "a",
        crop: "onion",
        date: "2026-09-01",
        min_price_paise: 0,
        max_price_paise: 0,
        modal_price_paise: 100,
        arrivals_tonnes: null,
        source: "agmarknet",
      },
      {
        mandi_id: "b",
        crop: "onion",
        date: "2026-09-01",
        min_price_paise: 0,
        max_price_paise: 0,
        modal_price_paise: 200,
        arrivals_tonnes: 40,
        source: "seed",
      },
    ];
    expect(buildAdviceInput(rows)[0].arrivalsTonnes).toBe(40);
  });
});

describe("mandisWithCoords", () => {
  it("keeps mandis with a saved lat/lng", () => {
    const withCoords = mandiPrice({ mandi: LASALGAON });
    expect(mandisWithCoords([withCoords])).toHaveLength(1);
  });

  it("drops a mandi with no saved location", () => {
    const noCoords = mandiPrice({ mandi: { id: "n3", name: "No GPS", lat: null, lng: null } });
    expect(mandisWithCoords([noCoords])).toHaveLength(0);
  });
});

describe("buildComparisonRows", () => {
  const near = mandiPrice({ mandi: LASALGAON, todayModalPricePaise: 190000 }) as RoutableMandiPrice; // ₹1,900/quintal
  const far = mandiPrice({ mandi: NIPHAD, todayModalPricePaise: 190010 }) as RoutableMandiPrice; // barely higher

  const baseParams = { quantityKg: 500, transitLossPct: 2, ratePerKmPaise: 1800 };

  it("sorts by what the farmer keeps, best row first", () => {
    // `near` (1 km) beats `far` (1,000 km) despite far's higher price - the
    // huge transport cost eats far's tiny price edge (SPEC.md §4.9 "a far
    // mandi with a higher price can lose").
    const legs: RouteLeg[] = [
      { km: 1, minutes: 2, source: "ors" },
      { km: 1000, minutes: 1200, source: "ors" },
    ];
    const rows = buildComparisonRows({ mandiPrices: [near, far], legs, ...baseParams });

    expect(rows[0].mandi.name).toBe("Lasalgaon");
    expect(rows[0].isBest).toBe(true);
    expect(rows[1].isBest).toBe(false);
    expect(rows[0].youKeepPaise).toBeGreaterThan(rows[1].youKeepPaise);
  });

  it("shows a negative you-keep instead of hiding the row (netRupee is not clamped)", () => {
    const tiny = mandiPrice({ mandi: LASALGAON, todayModalPricePaise: 1000 }) as RoutableMandiPrice; // ₹10/quintal
    const legs: RouteLeg[] = [{ km: 100, minutes: 150, source: "ors" }];
    const rows = buildComparisonRows({
      mandiPrices: [tiny],
      legs,
      quantityKg: 1,
      transitLossPct: 2,
      ratePerKmPaise: 1800,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].youKeepPaise).toBeLessThan(0);
  });

  it("flags isDemo when the price is a mock", () => {
    const mockPrice = mandiPrice({ mandi: LASALGAON, isDemo: true }) as RoutableMandiPrice;
    const legs: RouteLeg[] = [{ km: 5, minutes: 10, source: "ors" }];
    const rows = buildComparisonRows({ mandiPrices: [mockPrice], legs, ...baseParams });
    expect(rows[0].isDemo).toBe(true);
  });

  it("flags isDemo when the distance is a mock (straight-line fallback)", () => {
    const realPrice = mandiPrice({ mandi: LASALGAON, isDemo: false }) as RoutableMandiPrice;
    const legs: RouteLeg[] = [{ km: 5, minutes: 10, source: "mock" }];
    const rows = buildComparisonRows({ mandiPrices: [realPrice], legs, ...baseParams });
    expect(rows[0].isDemo).toBe(true);
  });

  it("sums transport + fees + loss + you-keep back to gross", () => {
    const legs: RouteLeg[] = [{ km: 20, minutes: 30, source: "ors" }];
    const rows = buildComparisonRows({ mandiPrices: [near], legs, ...baseParams });
    const row = rows[0];
    expect(row.transportPaise + row.feesPaise + row.lossPaise + row.youKeepPaise).toBe(
      row.grossPaise,
    );
  });
});
