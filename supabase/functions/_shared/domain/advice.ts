// Sell / hold advice v1 (SPEC.md §2.4) - simple rules, not a forecast model
// (the v2 model is P2, after enough price history is collected). Pure
// TypeScript only (CLAUDE.md §4 "shared domain code") - used by the prices
// screen's AdviceCard (2.4), and offline from saved price history.

export type AdviceReason =
  | "priceRising"
  | "priceFalling"
  | "rainExpected"
  | "noRain"
  | "arrivalsFalling"
  | "arrivalsRising";

export type PriceDay = {
  date: string;
  modalPricePaise: number;
  arrivalsTonnes: number;
};

export type Advice = {
  action: "sell" | "hold";
  holdDays: number;
  reasons: AdviceReason[];
};

// SPEC.md §2.4 "Hold N days where N = min(5, max_hold_days)".
export const HOLD_DAYS_CAP = 5;

// IMD's usual "rainy day" threshold - a day below this is treated as dry.
export const RAIN_MM_THRESHOLD = 2.5;

export type AdviceInput = {
  /** Price/arrival history, oldest first, at most the last 30 days. */
  history: PriceDay[];
  /** Forecast rainfall (mm) for each of the next 3 days. */
  rainMmNext3Days: number[];
  /** crop_rules.max_hold_days for this crop. */
  maxHoldDays: number;
};

/**
 * `null` when there isn't even a week of history - advising "Sell now" off
 * no data would be dishonest (CLAUDE.md §6 "missing data" edge case), so the
 * card should hide rather than guess.
 */
export function advise({ history, rainMmNext3Days, maxHoldDays }: AdviceInput): Advice | null {
  if (history.length < 7) return null;

  // SPEC.md §2.4 names this a 30-day average; guard against a caller
  // accidentally passing more than 30 days by only ever looking at the most
  // recent 30.
  const window = history.slice(-30);
  const last7 = history.slice(-7);

  const avg7Price = mean(last7.map((d) => d.modalPricePaise));
  const avgWindowPrice = mean(window.map((d) => d.modalPricePaise));
  const priceRising = avg7Price > avgWindowPrice;

  const avg7Arrivals = mean(last7.map((d) => d.arrivalsTonnes));
  const avgWindowArrivals = mean(window.map((d) => d.arrivalsTonnes));
  const arrivalsFalling = avg7Arrivals < avgWindowArrivals;

  const rainExpected = rainMmNext3Days.some((mm) => mm >= RAIN_MM_THRESHOLD);

  const upSignals = [priceRising, rainExpected, arrivalsFalling].filter(Boolean).length;
  const canHold = upSignals >= 2 && maxHoldDays > 0;

  if (canHold) {
    const reasons: AdviceReason[] = [];
    if (priceRising) reasons.push("priceRising");
    if (rainExpected) reasons.push("rainExpected");
    if (arrivalsFalling) reasons.push("arrivalsFalling");
    return { action: "hold", holdDays: Math.min(HOLD_DAYS_CAP, maxHoldDays), reasons };
  }

  const reasons: AdviceReason[] = [];
  if (!priceRising) reasons.push("priceFalling");
  if (!rainExpected) reasons.push("noRain");
  if (!arrivalsFalling) reasons.push("arrivalsRising");
  return { action: "sell", holdDays: 0, reasons };
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
