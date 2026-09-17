// Mandi heatmap colour (SPEC.md §2.4) - too much / normal / too little crop
// arriving at a mandi today, compared to its own 30-day average. Pure
// TypeScript only (CLAUDE.md §4 "shared domain code") - used by the prices
// screen (2.4) and by `cron-fetch-prices` (2.3), which recomputes
// `mandi_heat` the same way every day.
//
// `supabase/seed.sql` computes today's first `mandi_heat` rows in SQL with
// this exact formula and these exact thresholds (> 1.3 red, < 0.8 green) so
// the demo has a colour before any cron has run. That is duplicated logic,
// on purpose (SQL can't import TypeScript) - if the thresholds ever change,
// both places need the edit. See the plan's manual cross-check.

export type HeatColour = "red" | "yellow" | "green";

// SPEC.md §2.4 "expected_today = govt_or_seeded_arrivals + (our Digital Lots
// within 50 km in last 24 h × weight)". The weight is not calibrated yet -
// 1 tonne of Digital Lots counts the same as 1 tonne of government-reported
// arrivals until real data shows otherwise.
export const DIGITAL_LOT_WEIGHT = 1;

export type HeatRatioInput = {
  arrivalsTonnes: number;
  avgArrivals30dTonnes: number;
  /** Cropket Digital Lots created near this mandi in the last 24 h, if any. */
  nearbyLotTonnes?: number;
};

/**
 * `null` when there is no 30-day average to compare against (a brand-new
 * mandi/crop pair) - the caller must show "no data" grey, never divide by
 * zero into `Infinity`.
 */
export function heatRatio({
  arrivalsTonnes,
  avgArrivals30dTonnes,
  nearbyLotTonnes = 0,
}: HeatRatioInput): number | null {
  if (avgArrivals30dTonnes === 0) return null;
  const expectedToday = arrivalsTonnes + nearbyLotTonnes * DIGITAL_LOT_WEIGHT;
  return expectedToday / avgArrivals30dTonnes;
}

export function heatColour(ratio: number): HeatColour {
  if (ratio > 1.3) return "red";
  if (ratio < 0.8) return "green";
  return "yellow";
}
