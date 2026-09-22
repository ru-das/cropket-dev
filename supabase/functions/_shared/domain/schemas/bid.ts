// Shapes for the `place_bid` RPC (SPEC.md §5.3, §5.6, §9.2 Phase 3 "3.3").
// Pure TypeScript + zod only (CLAUDE.md §4 "shared domain code").
import { z } from "zod";

// Only 'lot' until 3.4 adds mega_lots and 'mega_lot' alongside it - the SQL
// function (20260922160000_bids.sql) rejects anything else the same way.
export const BidTargetType = z.enum(["lot"]);
export type BidTargetType = z.infer<typeof BidTargetType>;

// Same cap as the `bids.price_per_quintal_paise` check constraint - a
// sanity ceiling (₹1,00,000/quintal), not a real-world price.
const MAX_PRICE_PER_QUINTAL_PAISE = 10_000_000;

export const BidInput = z.object({
  targetType: BidTargetType,
  targetId: z.uuid(),
  pricePerQuintalPaise: z.number().int().positive().max(MAX_PRICE_PER_QUINTAL_PAISE),
});
export type BidInput = z.infer<typeof BidInput>;

export const BidResult = z.object({
  bidId: z.uuid(),
  isHighest: z.boolean(),
  belowFloor: z.boolean(),
});
export type BidResult = z.infer<typeof BidResult>;
