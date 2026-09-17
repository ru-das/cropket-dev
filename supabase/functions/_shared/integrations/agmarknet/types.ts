// Shared between index.ts, mock.ts, real.ts and parse.ts - same reason as
// integrations/ai/types.ts: mock/real don't need to import index.ts (which
// imports both of them) just to get this one type.
import type { Crop } from "../../domain/crops.ts";

/** What mock.ts needs to keep a believable day-to-day walk without a DB. */
export type LastKnown = { modalPricePaise: number; arrivalsTonnes: number | null };

export type MandiInput = {
  id: string;
  agmarknetName: string | null;
  agmarknetMarketId: number | null;
  /** Keyed by crop - a mandi's last known price/arrivals, per crop. */
  lastByCrop: Partial<Record<Crop, LastKnown>>;
};

export type FetchPricesInput = {
  /** Today, IST calendar date, `YYYY-MM-DD` - what gets written to `mandi_prices.date`. */
  date: string;
  crops: Crop[];
  mandis: MandiInput[];
};
