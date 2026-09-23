// Reads and writes `escrows` from the app side (SPEC.md §4.14, §5.4, §9.2
// Phase 4 "4.3") - the only file that calls the escrow-pay Edge Function
// (CLAUDE.md §3 "data access from the app goes through services/*"). Like
// deals.ts and bids.ts, this is online-only: paying for a deal is a money
// action, never queued in the outbox (AGENTS.md §4).
import { useMutation } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import type { AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { dealKeys } from "@/services/deals";
import { EscrowPayInput, EscrowPayResult } from "@shared/schemas/escrow.ts";

async function payEscrow(input: EscrowPayInput): Promise<EscrowPayResult> {
  const parsed = EscrowPayInput.parse(input);
  const result = await callFunction<EscrowPayResult>("escrow-pay", parsed);
  return EscrowPayResult.parse(result);
}

/** BuyerDealPage's "Pay and lock money" button. In mock mode escrow-pay
 * funds the escrow itself, so a success here already means FUNDED -
 * invalidating the buyer's deals list refetches it with the new state. */
export function usePayEscrow() {
  return useMutation<EscrowPayResult, AppError, EscrowPayInput>({
    mutationFn: payEscrow,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.mine() });
    },
  });
}
