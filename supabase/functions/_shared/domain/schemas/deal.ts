// Shapes for the `accept_bid` RPC (SPEC.md §4.13, §5.3, §9.2 Phase 3 "3.6").
// Pure TypeScript + zod only (CLAUDE.md §4 "shared domain code"), same
// shape as bid.ts.
import { z } from "zod";

export const AcceptBidInput = z.object({
  bidId: z.uuid(),
  consentAudioPath: z.string().min(1),
});
export type AcceptBidInput = z.infer<typeof AcceptBidInput>;

export const AcceptBidResult = z.object({
  dealId: z.uuid(),
  escrowId: z.uuid(),
});
export type AcceptBidResult = z.infer<typeof AcceptBidResult>;
