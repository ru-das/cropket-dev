// Net-₹: how much money a farmer actually keeps after selling at a given
// price and place (SPEC.md §2.4, §4.9 Net-₹ Comparator). Pure TypeScript
// only (CLAUDE.md §4 "shared domain code") - used by the comparator screen
// (2.5), which supplies `routeKm` from `route-distance` (ORS or the
// straight-line mock) and `ratePerKmPaise` from the seeded `transporters`.
import { grossPaise, pctOfPaise } from "./money.ts";

/**
 * A mandi's deductions, split the way a real APMC rate chart is: a
 * percentage of the sale value (commission, market fee, supervision) plus a
 * flat charge per quintal (hamali, tolai). A single blended percentage
 * drifts by roughly a point across Nashik's onion price swings - splitting
 * it keeps the comparator accurate at both ₹1,000 and ₹3,000 per quintal.
 */
export type SaleCharges = {
  commissionPct: number;
  flatPaisePerQuintal: number;
};

// SPEC.md §2.4 "fees = mandi commission % × gross (0 for Cropket, farmer
// pays ₹0)". Real APMC numbers, not guessed:
// - commissionPct 1.05 = ~1% market fee + ~0.05% supervision charge. Does
//   **not** include the ~6.5% adat (broker's commission) - Maharashtra's
//   2016 F&V deregulation puts that on the trader, not the farmer.
// - flatPaisePerQuintal 1200 (₹12/quintal) = hamali ₹5.17 per gunny bag
//   (~2 bags/quintal) + tolai ₹1.82 per 100 kg, from the APMC Vashi rate
//   chart (no published Lasalgaon chart found).
// ponytail: one blended rate stands in for every mandi. Add a per-mandi
// `commission_pct`/`flat_charge_paise` column when the team has each real
// APMC's rate chart (SPEC.md §5.6 `mandis`).
export const MANDI_CHARGES: SaleCharges = { commissionPct: 1.05, flatPaisePerQuintal: 1200 };
export const CROPKET_CHARGES: SaleCharges = { commissionPct: 0, flatPaisePerQuintal: 0 };

export type NetRupeeInput = {
  pricePerQuintalPaise: number;
  quantityKg: number;
  routeKm: number;
  ratePerKmPaise: number;
  charges: SaleCharges;
  /** crop_rules.transit_loss_pct - weight lost in transit, as a % of gross value. */
  transitLossPct: number;
};

export type NetRupeeResult = {
  grossPaise: number;
  transportPaise: number;
  feesPaise: number;
  lossPaise: number;
  youKeepPaise: number;
};

/**
 * SPEC.md §2.4: `you_keep = gross − transport − fees − loss − damage`.
 * `damage` (route-risk smart routing) is P2 and not built here.
 *
 * Not clamped at zero - a tiny lot sold far away really can cost more than
 * it earns, and showing that loss plainly is the whole point of the
 * comparator (never hide a bad option as ₹0).
 */
export function netRupee(input: NetRupeeInput): NetRupeeResult {
  const gross = grossPaise(input.pricePerQuintalPaise, input.quantityKg);
  const transport = Math.round(input.routeKm * input.ratePerKmPaise);
  const fees =
    pctOfPaise(gross, input.charges.commissionPct) +
    Math.round((input.charges.flatPaisePerQuintal * input.quantityKg) / 100);
  const loss = pctOfPaise(gross, input.transitLossPct);
  return {
    grossPaise: gross,
    transportPaise: transport,
    feesPaise: fees,
    lossPaise: loss,
    youKeepPaise: gross - transport - fees - loss,
  };
}
