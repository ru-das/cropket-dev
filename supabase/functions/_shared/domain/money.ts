// Paise <-> rupee conversion and the one rounding rule for money math
// (CLAUDE.md §4 "money is always whole paise"). Every other domain file
// (floor.ts, heat.ts, netRupee.ts) builds its totals with these helpers so
// there is exactly one place that rounds. Pure TypeScript only (CLAUDE.md
// §4 "shared domain code") - used by the app and by Edge Functions.

/** Rupees a person typed -> paise stored in the DB. Rounds to the nearest paisa. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Paise from the DB -> rupees for display or further math. */
export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * Paise -> a farmer-facing string. Whole rupees only (farmers never see
 * paise) with Indian digit grouping (CLAUDE.md §4 "Intl.NumberFormat('en-IN')
 * (₹1,50,000)").
 */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toRupees(paise));
}

/**
 * A percentage of a paise amount, rounded once. The single rounding rule
 * every fee/loss calculation in this folder uses, so two callers computing
 * the same percentage never disagree by a paisa.
 */
export function pctOfPaise(paise: number, pct: number): number {
  return Math.round((paise * pct) / 100);
}

/**
 * SPEC.md §2.4 `gross = price_per_quintal × quantity_kg / 100` (100 kg per
 * quintal). Price is paise per quintal, so the result is paise.
 */
export function grossPaise(pricePerQuintalPaise: number, quantityKg: number): number {
  return Math.round((pricePerQuintalPaise * quantityKg) / 100);
}
