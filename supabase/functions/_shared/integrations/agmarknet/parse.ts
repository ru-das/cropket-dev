// All the real logic for real.ts, kept pure so Vitest can test it without a
// network call or Deno (CLAUDE.md §4 "Edge Function code can't be
// type-checked on this laptop... keep function files thin, put real logic
// in domain/ where Vitest tests it" - same idea applies to an integration
// adapter's parsing code).
//
// Two upstreams, two shapes, checked live against real responses on
// 2026-09-17 (see the 2.3 plan):
// - data.gov.in's daily-price resource: no arrivals column, dates as
//   "DD/MM/YYYY", market names carry a trailing space ("APMC Yeola ").
// - the Agmarknet dashboard API (undocumented, no key/captcha): arrivals in
//   metric tonnes as a numeric *string*, dates as "DD-MM-YYYY", and it
//   answers with whatever it last has ("reported_date"), ignoring a stale
//   `date` in the request - so arrivals are only attached to a price row
//   when both dates actually agree; otherwise the row keeps
//   `arrivalsTonnes: null` rather than pairing two different days
//   (CLAUDE.md §5 honesty rule).
import { z } from "zod";
import type { Crop } from "../../domain/crops.ts";
import { toPaise } from "../../domain/money.ts";
import { DailyPrice } from "../../domain/schemas/prices.ts";
import type { MandiInput } from "./types.ts";

type PriceDraft = {
  mandiId: string;
  crop: Crop;
  date: string;
  minPricePaise: number;
  maxPricePaise: number;
  modalPricePaise: number;
};

export function cropToCommodityName(crop: Crop): string {
  return crop.charAt(0).toUpperCase() + crop.slice(1);
}

/** "17/09/2026" or "17-09-2026" -> "2026-09-17". Both upstreams use DD, just different separators. */
export function ddmmyyyyToIso(value: string): string {
  const [day, month, year] = value.split(/[/-]/);
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** "2026-09-17" -> "17-09-2026", the format the Agmarknet dashboard POST expects. */
export function isoToDDMMYYYY(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
}

export function arrivalKey(mandiId: string, crop: Crop): string {
  return `${mandiId}:${crop}`;
}

function matchMandiByName(mandis: MandiInput[], rawName: string): MandiInput | undefined {
  const name = rawName.trim().toLowerCase();
  return mandis.find((m) => m.agmarknetName?.trim().toLowerCase() === name);
}

// Loose on purpose: only the fields we read are checked, extra columns
// (variety, grade, ...) pass through untouched. This is the trust-boundary
// check CLAUDE.md §5 asks for ("validate results with zod") - it's what
// stops a shape change upstream from crashing the whole cron instead of
// just dropping the row it can't understand.
const DataGovRecord = z.object({
  market: z.string(),
  arrival_date: z.string(),
  min_price: z.number(),
  max_price: z.number(),
  modal_price: z.number(),
});
const DataGovResponse = z.object({ records: z.array(DataGovRecord.passthrough()) });

export function parseDataGovResponse(json: unknown, crop: Crop, mandis: MandiInput[]): PriceDraft[] {
  const parsed = DataGovResponse.safeParse(json);
  if (!parsed.success) return [];

  // Keyed by mandi+date so a duplicate row for the same day (seen once in
  // testing) overwrites rather than doubles up - upsert would have done the
  // same at the DB, this just avoids sending both.
  const byMandiDate = new Map<string, PriceDraft>();
  for (const row of parsed.data.records) {
    const mandi = matchMandiByName(mandis, row.market);
    if (!mandi) continue; // a Nashik market we haven't onboarded - not an error
    const draft: PriceDraft = {
      mandiId: mandi.id,
      crop,
      date: ddmmyyyyToIso(row.arrival_date),
      minPricePaise: toPaise(row.min_price),
      maxPricePaise: toPaise(row.max_price),
      modalPricePaise: toPaise(row.modal_price),
    };
    byMandiDate.set(`${draft.mandiId}:${draft.date}`, draft);
  }
  return [...byMandiDate.values()];
}

const AgmarknetArrivalRecord = z.object({
  cmdt_name: z.string(),
  as_on_arrival: z.string().nullable(),
  reported_date: z.string(),
});
const AgmarknetDashboardResponse = z.object({
  data: z.object({ records: z.array(AgmarknetArrivalRecord.passthrough()) }),
});

/** `null` when the crop simply didn't report at this mandi/market today - a normal result, not an error. */
export function parseAgmarknetArrivalResponse(json: unknown, crop: Crop): { date: string; tonnes: number } | null {
  const parsed = AgmarknetDashboardResponse.safeParse(json);
  if (!parsed.success) return null;

  const commodityName = cropToCommodityName(crop);
  const record = parsed.data.data.records.find((r) => r.cmdt_name === commodityName);
  if (!record || record.as_on_arrival == null) return null;

  const tonnes = Number(record.as_on_arrival);
  if (!Number.isFinite(tonnes)) return null;
  return { date: ddmmyyyyToIso(record.reported_date), tonnes };
}

/**
 * Attaches arrivals to a price row only when the arrivals answer is for the
 * exact same calendar day as the price row - a price for "today" paired
 * with an arrivals figure from two days ago would be a wrong number wearing
 * a real number's badge, worse than admitting we don't know.
 */
export function mergePricesWithArrivals(
  drafts: PriceDraft[],
  arrivalsByKey: Map<string, { date: string; tonnes: number } | null>,
): DailyPrice[] {
  const result: DailyPrice[] = [];
  for (const draft of drafts) {
    const found = arrivalsByKey.get(arrivalKey(draft.mandiId, draft.crop));
    const arrivalsTonnes = found && found.date === draft.date ? found.tonnes : null;
    const parsed = DailyPrice.safeParse({ ...draft, arrivalsTonnes, source: "agmarknet" });
    if (parsed.success) result.push(parsed.data);
  }
  return result;
}
