// Turns a released escrow into payout lines (SPEC.md §5.7 "Release split
// order", CLAUDE.md §6 "sum of payouts = escrow total to the paisa;
// rounding goes to the largest share; platform fee never reduces farmer
// money"). Pure TypeScript only (CLAUDE.md §4 "shared domain code") - used
// by `escrow-release` (4.8), which maps each line to a `payouts` row.
//
// ponytail: SPEC §5.7 also lists a rejected-crate hold (step 1, disputes
// are P1), driver freight/advance (step 2, P2) and EMI (step 3, P2) before
// the farmer split. None of those have real data anywhere in the prototype
// yet, so they're left out here - add them as extra deductions from the
// pool, taken before the farmer-share loop, when 4.8 or a P1/P2 item needs
// them.

export type FarmerKg = { farmerId: string; quantityKg: number };

export type SplitInput = {
  /** What the escrow holds in total - deal total + the platform fee, paid on top by the buyer. */
  escrowTotalPaise: number;
  feePaise: number;
  farmers: FarmerKg[];
};

export type PayoutLine =
  | { type: "farmer_share"; farmerId: string; amountPaise: number }
  | { type: "platform_fee"; amountPaise: number };

/**
 * Splits a released escrow into payout lines. Farmer shares are
 * proportional to `quantityKg`; leftover paise from rounding go to the
 * farmer with the largest share so the sum always matches the escrow total
 * exactly. The platform fee was paid on top by the buyer, so it never
 * comes out of the farmer pool. Throws (never silently clamps or drops
 * money) on any input that doesn't add up - this is a money path and must
 * fail closed (CLAUDE.md §5 "Money (fail closed)").
 */
export function splitRelease(input: SplitInput): PayoutLine[] {
  const { escrowTotalPaise, feePaise, farmers } = input;

  if (!Number.isInteger(escrowTotalPaise) || escrowTotalPaise <= 0) {
    throw new Error("SPLIT_INVALID_INPUT escrowTotalPaise must be a positive integer");
  }
  if (!Number.isInteger(feePaise) || feePaise < 0) {
    throw new Error("SPLIT_INVALID_INPUT feePaise must be a non-negative integer");
  }
  if (feePaise >= escrowTotalPaise) {
    throw new Error("SPLIT_INVALID_INPUT feePaise must be less than escrowTotalPaise");
  }
  if (farmers.length === 0) {
    throw new Error("SPLIT_INVALID_INPUT at least one farmer is required");
  }
  for (const farmer of farmers) {
    if (!Number.isInteger(farmer.quantityKg) || farmer.quantityKg <= 0) {
      throw new Error(
        `SPLIT_INVALID_INPUT quantityKg for ${farmer.farmerId} must be a positive integer`,
      );
    }
  }

  const farmerPoolPaise = escrowTotalPaise - feePaise;
  const totalKg = farmers.reduce((sum, f) => sum + f.quantityKg, 0);

  const shares = farmers.map((f) => Math.floor((farmerPoolPaise * f.quantityKg) / totalKg));
  const leftoverPaise = farmerPoolPaise - shares.reduce((sum, s) => sum + s, 0);

  // Largest share gets the rounding leftover; a tie keeps the first farmer
  // in input order, so a retry always produces the same payouts.
  let largestIndex = 0;
  for (let i = 1; i < farmers.length; i++) {
    if (farmers[i].quantityKg > farmers[largestIndex].quantityKg) largestIndex = i;
  }
  shares[largestIndex] += leftoverPaise;

  const lines: PayoutLine[] = farmers
    .map((f, i) => ({ type: "farmer_share" as const, farmerId: f.farmerId, amountPaise: shares[i] }))
    .filter((line) => line.amountPaise > 0); // payouts.amount_paise > 0 - never emit a zero line

  if (feePaise > 0) {
    lines.push({ type: "platform_fee", amountPaise: feePaise });
  }

  return lines;
}
