// Reads market data for the prices screen (SPEC.md §4.8, §9.2 Phase 2 "2.4
// Prices screen") - the only file that talks to Supabase for mandis,
// mandi_prices, mandi_heat, weather_daily and crop_rules (CLAUDE.md §3
// "data access from the app goes through services/*"). Every formula here
// was already built and unit-tested in `_shared/domain/` (2.2/2.3) - this
// file only shapes DB rows into what those formulas expect, plus the one
// new decision for this screen: which mandi is the headline price.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errors";
import { advise, type Advice, type PriceDay } from "@shared/advice.ts";
import { referenceFloorPaise, type FloorMethod } from "@shared/floor.ts";
import type { HeatColour } from "@shared/heat.ts";
import { haversineKm, type LatLng } from "@shared/geo.ts";
import type { Crop } from "@shared/crops.ts";
import type { Database } from "@/lib/database.types";

type MandiRow = Pick<Database["public"]["Tables"]["mandis"]["Row"], "id" | "name" | "lat" | "lng">;
type PriceRow = Database["public"]["Tables"]["mandi_prices"]["Row"];
type HeatRow = Database["public"]["Tables"]["mandi_heat"]["Row"];

export type MandiPrice = {
  mandi: MandiRow;
  todayModalPricePaise: number;
  yesterdayModalPricePaise: number | null;
  /** `source !== "agmarknet"` - a seeded or mock row (CLAUDE.md §5 honesty rule). */
  isDemo: boolean;
  /** null = no 30-day average yet for this mandi/crop - show "no data" grey, never guess. */
  heat: { ratio: number; colour: HeatColour } | null;
};

export type HeroMandi = {
  mandi: MandiRow;
  modalPricePaise: number;
  yesterdayModalPricePaise: number | null;
  isDemo: boolean;
  reason: "bestPrice" | "nearest";
};

export type MarketSnapshot = {
  crop: Crop;
  mandiPrices: MandiPrice[];
  advice: Advice | null;
  floorPaise: number | null;
  perishability: number;
};

export const priceKeys = {
  market: (crop: Crop) => ["prices", "market", crop] as const,
};

// crop_rules.perishability: onion/potato = 3, tomato = 9 (SPEC.md §2.3) -
// 7 is comfortably between them, matching the P0 decision that only a
// highly perishable crop (tomato) should be ranked by distance.
const PERISHABLE_THRESHOLD = 7;

/** Today's date in Nashik's own calendar day, as "YYYY-MM-DD" (matches Postgres `date` columns). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Newest-dated row per mandi_id. mandi_prices and mandi_heat share this (mandi_id, date) shape. */
export function latestPerMandi<T extends { mandi_id: string; date: string }>(
  rows: T[],
): Map<string, T> {
  const out = new Map<string, T>();
  for (const row of rows) {
    const current = out.get(row.mandi_id);
    if (!current || row.date > current.date) out.set(row.mandi_id, row);
  }
  return out;
}

function priceOnDate(rows: PriceRow[], mandiId: string, date: string): PriceRow | undefined {
  return rows.find((row) => row.mandi_id === mandiId && row.date === date);
}

/** `source !== "agmarknet"` - seeded demo history or a keyless mock day. */
export function isDemoPrice(source: string): boolean {
  return source !== "agmarknet";
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * The crop's 30-day price/arrivals history, averaged across all 5 Nashik
 * mandis into one row per day (oldest first) - the shape advise() expects.
 * SPEC.md §2.4's sell/hold advice is district-wide ("Onion price today"),
 * not per-mandi; the per-mandi spread is what MandiHeatmap/MandiList show.
 */
export function buildAdviceInput(historyRows: PriceRow[]): PriceDay[] {
  const byDate = new Map<string, { prices: number[]; arrivals: number[] }>();
  for (const row of historyRows) {
    const bucket = byDate.get(row.date) ?? { prices: [], arrivals: [] };
    bucket.prices.push(row.modal_price_paise);
    if (row.arrivals_tonnes !== null) bucket.arrivals.push(row.arrivals_tonnes);
    byDate.set(row.date, bucket);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { prices, arrivals }]) => ({
      date,
      modalPricePaise: Math.round(mean(prices)),
      arrivalsTonnes: arrivals.length > 0 ? mean(arrivals) : 0,
    }));
}

/**
 * Which mandi's price is the headline (SPEC.md §4.8 PriceHero) - the one
 * choice this screen makes that isn't already a tested formula. A highly
 * perishable crop (tomato: crop_rules.perishability = 9) is ranked by
 * distance, because time in a truck is the risk, not the price; everything
 * else (onion, potato) is ranked by today's best price. No saved farmer
 * location -> always best price, never a guessed "nearest".
 *
 * ponytail: distance here is straight-line km (haversineKm), not real
 * travel time - a short bad road can take longer than a long good one.
 * `route-distance` (2.5) adds real ORS travel time; swap the ranking key
 * there if it ever needs to beat straight-line distance.
 */
export function pickHeroMandi(params: {
  mandiPrices: MandiPrice[];
  perishability: number;
  farmerLocation: LatLng | null;
}): HeroMandi | null {
  const { mandiPrices, perishability, farmerLocation } = params;
  if (mandiPrices.length === 0) return null;

  const withCoords = mandiPrices.filter(
    (m): m is MandiPrice & { mandi: { lat: number; lng: number } } =>
      m.mandi.lat !== null && m.mandi.lng !== null,
  );
  const rankByDistance =
    perishability >= PERISHABLE_THRESHOLD && farmerLocation !== null && withCoords.length > 0;

  const picked = rankByDistance
    ? withCoords.reduce((closest, m) =>
        haversineKm(farmerLocation!, { lat: m.mandi.lat, lng: m.mandi.lng }) <
        haversineKm(farmerLocation!, { lat: closest.mandi.lat, lng: closest.mandi.lng })
          ? m
          : closest,
      )
    : mandiPrices.reduce((best, m) =>
        m.todayModalPricePaise > best.todayModalPricePaise ? m : best,
      );

  return {
    mandi: picked.mandi,
    modalPricePaise: picked.todayModalPricePaise,
    yesterdayModalPricePaise: picked.yesterdayModalPricePaise,
    isDemo: picked.isDemo,
    reason: rankByDistance ? "nearest" : "bestPrice",
  };
}

async function fetchMarketSnapshot(crop: Crop): Promise<MarketSnapshot> {
  const today = todayIso();
  const historyStart = addDays(today, -30);

  const [mandisRes, pricesRes, heatRes, weatherRes, cropRuleRes] = await Promise.all([
    supabase.from("mandis").select("id, name, lat, lng"),
    supabase.from("mandi_prices").select("*").eq("crop", crop).gte("date", historyStart),
    supabase.from("mandi_heat").select("*").eq("crop", crop).gte("date", addDays(today, -2)),
    supabase.from("weather_daily").select("*").eq("district", "Nashik").gt("date", today),
    supabase.from("crop_rules").select("*").eq("crop", crop).single(),
  ]);

  // Checked one at a time, not in a loop over an array - Postgrest's
  // response type is a discriminated union on `error`, so only a check on
  // each variable by name narrows its own `.data` to non-null afterwards.
  if (mandisRes.error) throw toAppError(mandisRes.error);
  if (pricesRes.error) throw toAppError(pricesRes.error);
  if (heatRes.error) throw toAppError(heatRes.error);
  if (weatherRes.error) throw toAppError(weatherRes.error);
  if (cropRuleRes.error) throw toAppError(cropRuleRes.error);

  const mandis: MandiRow[] = mandisRes.data;
  const priceRows: PriceRow[] = pricesRes.data;
  const heatByMandi = latestPerMandi<HeatRow>(heatRes.data);
  const cropRule = cropRuleRes.data;

  const mandiPrices: MandiPrice[] = mandis
    .map((mandi): MandiPrice | null => {
      const todayRow = priceOnDate(priceRows, mandi.id, today);
      if (!todayRow) return null; // no price today for this mandi - leave it out, never show a blank/zero
      const yesterdayRow = priceOnDate(priceRows, mandi.id, addDays(today, -1));
      const heat = heatByMandi.get(mandi.id);
      return {
        mandi,
        todayModalPricePaise: todayRow.modal_price_paise,
        yesterdayModalPricePaise: yesterdayRow?.modal_price_paise ?? null,
        isDemo: isDemoPrice(todayRow.source),
        heat: heat ? { ratio: heat.ratio, colour: heat.colour as HeatColour } : null,
      };
    })
    .filter((row): row is MandiPrice => row !== null);

  return {
    crop,
    mandiPrices,
    advice: advise({
      history: buildAdviceInput(priceRows),
      rainMmNext3Days: (weatherRes.data ?? []).map((w) => w.rain_mm),
      maxHoldDays: cropRule.max_hold_days,
    }),
    floorPaise: referenceFloorPaise({
      method: cropRule.floor_method as FloorMethod,
      mspPerQuintalPaise: cropRule.msp_per_quintal_paise,
      modalPricesPaise: priceRows.map((row) => row.modal_price_paise),
    }),
    perishability: cropRule.perishability,
  };
}

/**
 * Everything the prices screen needs for one crop, persisted to IndexedDB
 * (offline/persist.ts) so it still renders with no internet (SPEC.md §5.8).
 * One query for the whole snapshot -> one `dataUpdatedAt` for `<DataAge>`.
 */
export function useMarketData(crop: Crop) {
  return useQuery({ queryKey: priceKeys.market(crop), queryFn: () => fetchMarketSnapshot(crop) });
}
