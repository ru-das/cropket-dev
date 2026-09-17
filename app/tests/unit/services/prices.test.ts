// Pure helpers behind services/prices.ts (SPEC.md §4.8, §9.2 Phase 2 "2.4
// Prices screen") - same pattern as lots.test.ts/grading.test.ts: test the
// pure half, leave the Supabase round trip in fetchMarketSnapshot() thin
// and untested directly.
import { describe, expect, it } from "vitest";
import {
  buildAdviceInput,
  isDemoPrice,
  latestPerMandi,
  pickHeroMandi,
  type MandiPrice,
} from "@/services/prices";

const LASALGAON = { id: "n1", name: "Lasalgaon", lat: 20.1462, lng: 74.234 };
const NIPHAD = { id: "n2", name: "Niphad", lat: 20.0847, lng: 74.1116 };

function mandiPrice(overrides: Partial<MandiPrice> & { mandi: MandiPrice["mandi"] }): MandiPrice {
  return {
    todayModalPricePaise: 100000,
    yesterdayModalPricePaise: null,
    isDemo: false,
    heat: null,
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
