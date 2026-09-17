// CLAUDE.md §6 "Mock adapters: mock output passes the same zod schema as
// real (test the pure mock.ts files)" plus parse.ts, where all of real.ts's
// actual logic lives (CLAUDE.md §4 "keep function files thin"). The fixture
// shapes below were captured from the live data.gov.in and Agmarknet
// responses on 2026-09-17 (see the 2.3 plan) - trailing space on the market
// name, DD/MM/YYYY and DD-MM-YYYY dates, arrivals as a numeric string.
import { describe, expect, it } from "vitest";
import { DailyPrice } from "@shared/schemas/prices.ts";
import { fetchPrices as fetchMockPrices } from "../../../../supabase/functions/_shared/integrations/agmarknet/mock.ts";
import {
  ddmmyyyyToIso,
  isoToDDMMYYYY,
  mergePricesWithArrivals,
  parseAgmarknetArrivalResponse,
  parseDataGovResponse,
} from "../../../../supabase/functions/_shared/integrations/agmarknet/parse.ts";
import type { MandiInput } from "../../../../supabase/functions/_shared/integrations/agmarknet/types.ts";

const mandi: MandiInput = {
  id: "10000000-0000-0000-0000-000000000004",
  agmarknetName: "APMC Yeola",
  agmarknetMarketId: 159,
  lastByCrop: {},
};

describe("integrations/agmarknet mock", () => {
  it("returns rows that pass DailyPrice, the same schema real.ts must pass", async () => {
    const rows = await fetchMockPrices({ date: "2026-09-17", crops: ["onion"], mandis: [mandi] });
    expect(rows).toHaveLength(1);
    expect(DailyPrice.safeParse(rows[0]).success).toBe(true);
  });

  it("marks itself as a mock", async () => {
    const [row] = await fetchMockPrices({ date: "2026-09-17", crops: ["onion"], mandis: [mandi] });
    expect(row.source).toBe("mock");
  });

  it("walks from the mandi's last known price instead of a fixed number", async () => {
    const withHistory: MandiInput = {
      ...mandi,
      lastByCrop: { onion: { modalPricePaise: 500_000, arrivalsTonnes: 40 } },
    };
    const [row] = await fetchMockPrices({ date: "2026-09-17", crops: ["onion"], mandis: [withHistory] });
    // +-5% walk from 500,000 paise
    expect(row.modalPricePaise).toBeGreaterThanOrEqual(475_000);
    expect(row.modalPricePaise).toBeLessThanOrEqual(525_000);
  });
});

describe("integrations/agmarknet date parsing", () => {
  it("converts data.gov.in's DD/MM/YYYY to ISO", () => {
    expect(ddmmyyyyToIso("17/09/2026")).toBe("2026-09-17");
  });

  it("converts Agmarknet's DD-MM-YYYY to ISO", () => {
    expect(ddmmyyyyToIso("15-09-2026")).toBe("2026-09-15");
  });

  it("converts ISO back to DD-MM-YYYY for the Agmarknet request body", () => {
    expect(isoToDDMMYYYY("2026-09-17")).toBe("17-09-2026");
  });
});

describe("integrations/agmarknet parseDataGovResponse", () => {
  // Real shape from GET .../resource/{id}?filters[district.keyword]=Nashik&filters[commodity.keyword]=Onion
  const dataGovFixture = {
    records: [
      { market: "APMC Yeola ", arrival_date: "17/09/2026", min_price: 1500, max_price: 4780, modal_price: 3900 },
      { market: "Some Other Market ", arrival_date: "17/09/2026", min_price: 100, max_price: 200, modal_price: 150 },
    ],
  };

  it("matches a market name with a trailing space to the mandi's agmarknet_name", () => {
    const rows = parseDataGovResponse(dataGovFixture, "onion", [mandi]);
    expect(rows).toHaveLength(1);
    expect(rows[0].mandiId).toBe(mandi.id);
  });

  it("converts whole rupees to paise", () => {
    const [row] = parseDataGovResponse(dataGovFixture, "onion", [mandi]);
    expect(row.minPricePaise).toBe(150_000);
    expect(row.maxPricePaise).toBe(478_000);
    expect(row.modalPricePaise).toBe(390_000);
  });

  it("drops rows for a market we haven't onboarded", () => {
    const rows = parseDataGovResponse(dataGovFixture, "onion", [mandi]);
    expect(rows.some((r) => r.mandiId !== mandi.id)).toBe(false);
  });

  it("returns nothing for a response with an unexpected shape, instead of throwing", () => {
    expect(parseDataGovResponse({ oops: true }, "onion", [mandi])).toEqual([]);
  });
});

describe("integrations/agmarknet parseAgmarknetArrivalResponse", () => {
  // Real shape from POST https://api.agmarknet.gov.in/v1/dashboard-data/ - this
  // market only reported Tomato that day, not Onion.
  const arrivalFixture = {
    data: {
      records: [{ cmdt_name: "Tomato", as_on_arrival: "6309.00", reported_date: "15-09-2026" }],
    },
  };

  it("reads the matching crop's arrivals in tonnes", () => {
    expect(parseAgmarknetArrivalResponse(arrivalFixture, "tomato")).toEqual({ date: "2026-09-15", tonnes: 6309 });
  });

  it("returns null when the crop didn't report at this market that day", () => {
    expect(parseAgmarknetArrivalResponse(arrivalFixture, "onion")).toBeNull();
  });
});

describe("integrations/agmarknet mergePricesWithArrivals", () => {
  const draft = {
    mandiId: mandi.id,
    crop: "onion" as const,
    date: "2026-09-17",
    minPricePaise: 150_000,
    maxPricePaise: 478_000,
    modalPricePaise: 390_000,
  };

  it("attaches arrivals when the arrivals answer is for the same day as the price", () => {
    const map = new Map([[`${mandi.id}:onion`, { date: "2026-09-17", tonnes: 42 }]]);
    const [row] = mergePricesWithArrivals([draft], map);
    expect(row.arrivalsTonnes).toBe(42);
  });

  it("leaves arrivals null when the arrivals answer is for a different day", () => {
    const map = new Map([[`${mandi.id}:onion`, { date: "2026-09-15", tonnes: 42 }]]);
    const [row] = mergePricesWithArrivals([draft], map);
    expect(row.arrivalsTonnes).toBeNull();
  });

  it("leaves arrivals null when there is no arrivals answer at all", () => {
    const [row] = mergePricesWithArrivals([draft], new Map());
    expect(row.arrivalsTonnes).toBeNull();
  });

  it("drops a row where min_price ended up above modal_price", () => {
    const broken = { ...draft, minPricePaise: 999_999 };
    expect(mergePricesWithArrivals([broken], new Map())).toEqual([]);
  });
});
