// Shared between index.ts, mock.ts and real.ts - same reason as
// integrations/ors/types.ts: mock/real don't need to import index.ts
// (which imports both of them) just to get this one type.
import type { PayoutLine } from "../../domain/split.ts";

export type CreateOrderInput = { orderId: string; amountPaise: number; customerId: string };

// release.ts (4.8) hands split.ts's own payout lines straight through -
// the adapter doesn't reshape them, only sends them on to Cashfree Easy
// Split (mock or real).
export type ReleaseSplitInput = { orderId: string; lines: PayoutLine[] };
