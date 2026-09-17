// Reference Floor Price (SPEC.md §2.3, §2.4) - the price below which a sale
// looks risky for the farmer. **Advisory: warns, never blocks** (APMC safe -
// SPEC.md §10.7, CLAUDE.md §6 "the floor price warns, never blocks"). Pure
// TypeScript only (CLAUDE.md §4 "shared domain code") - used by the prices
// screen (2.4) and, offline, from saved price history; `place_bid` (3.3)
// re-checks the same rule in SQL, which is the actual authority for bids.

// Matches the `crop_rules.floor_method` check constraint (2.1 migration).
export type FloorMethod = "p20_modal_30d" | "msp";

export type FloorInput = {
  method: FloorMethod;
  /** Only set for `has_msp` crops (crop_rules.msp_per_quintal_paise, nullable). */
  mspPerQuintalPaise?: number | null;
  /** Modal prices (paise per quintal) for the last 30 days in the district. */
  modalPricesPaise: number[];
};

/**
 * SPEC.md §2.3: MSP crops use MSP; everyone else uses the 20th-percentile
 * modal price of the last 30 days. `null` means "we don't know" (no MSP set,
 * or no price history yet) - the caller must treat that as no warning, never
 * as a floor of ₹0.
 */
export function referenceFloorPaise(input: FloorInput): number | null {
  if (input.method === "msp") {
    return input.mspPerQuintalPaise ?? null;
  }
  return percentile20(input.modalPricesPaise);
}

/** Nearest-rank 20th percentile of a sorted-ascending copy of `values`. */
function percentile20(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(0.2 * sorted.length) - 1);
  return sorted[idx];
}

/**
 * A price *at* the floor is not below it - the floor warns on a strictly
 * lower offer, not on a match. No floor known -> never warn.
 */
export function isBelowFloor(pricePerQuintalPaise: number, floorPaise: number | null): boolean {
  if (floorPaise === null) return false;
  return pricePerQuintalPaise < floorPaise;
}
