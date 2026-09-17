// Fake prices for when DATA_GOV_API_KEY / AGMARKNET_RESOURCE_ID are missing
// (SPEC.md §2.2 "adapter pattern" / CLAUDE.md §5 "missing keys never stop
// work"). A small ±5% walk from each mandi/crop's last known price and
// arrivals, so the demo prices screen (2.4) still moves day to day instead
// of freezing - same idea as `integrations/ai/mock.ts`, just with a walk
// instead of one fixed value, because a frozen mandi price would look
// broken on a screen whose whole point is "today's price, ⬆ ₹60".
import type { DailyPrice } from "../../domain/schemas/prices.ts";
import type { FetchPricesInput } from "./types.ts";

// Used the first time a mandi/crop has no stored price yet to walk from.
const FALLBACK_MODAL_PAISE = 200_000; // ₹2,000/quintal
const FALLBACK_ARRIVALS_TONNES = 50;

function walk(value: number, maxPct: number): number {
  const pct = (Math.random() * 2 - 1) * maxPct;
  return Math.max(0, Math.round(value * (1 + pct / 100)));
}

export function fetchPrices(input: FetchPricesInput): Promise<DailyPrice[]> {
  const rows: DailyPrice[] = [];
  for (const mandi of input.mandis) {
    for (const crop of input.crops) {
      const last = mandi.lastByCrop[crop];
      const modalPricePaise = walk(last?.modalPricePaise ?? FALLBACK_MODAL_PAISE, 5);
      rows.push({
        mandiId: mandi.id,
        crop,
        date: input.date,
        minPricePaise: Math.round(modalPricePaise * 0.9),
        maxPricePaise: Math.round(modalPricePaise * 1.1),
        modalPricePaise,
        arrivalsTonnes: walk(last?.arrivalsTonnes ?? FALLBACK_ARRIVALS_TONNES, 5),
        source: "mock",
      });
    }
  }
  return Promise.resolve(rows);
}
