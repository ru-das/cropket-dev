// Reads and writes `escrows` from the app side (SPEC.md §4.14, §5.4, §9.2
// Phase 4 "4.3"/"4.5") - the only file that calls the escrow-pay and
// delivery-code Edge Functions (CLAUDE.md §3 "data access from the app goes
// through services/*"). Paying is online-only, like deals.ts/bids.ts
// (AGENTS.md §4); reading the delivery code is not a money action, so it's
// a plain query, cached like any other read (SPEC §5.8) - the buyer can
// still see the code offline at the drop point once it's been fetched once.
import { useMutation, useQuery } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import type { AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { dealKeys } from "@/services/deals";
import {
  EscrowPayInput,
  EscrowPayResult,
  DeliveryCodeInput,
  DeliveryCodeResult,
} from "@shared/schemas/escrow.ts";

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

export const escrowKeys = {
  deliveryCode: (escrowId: string) => ["escrow", "deliveryCode", escrowId] as const,
};

async function getDeliveryCode(escrowId: string): Promise<DeliveryCodeResult> {
  const parsed = DeliveryCodeInput.parse({ escrowId });
  const result = await callFunction<DeliveryCodeResult>("delivery-code", parsed);
  return DeliveryCodeResult.parse(result);
}

/** BuyerDealPage's `OtpDigits` card. `staleTime: Infinity` - the code is
 * derived from the escrow id and never changes, so there's nothing to
 * refetch (unlike escrow state, which does need a refetch after paying). */
export function useDeliveryCode(escrowId: string | undefined) {
  return useQuery({
    queryKey: escrowKeys.deliveryCode(escrowId ?? ""),
    queryFn: () => getDeliveryCode(escrowId as string),
    enabled: escrowId !== undefined,
    staleTime: Infinity,
  });
}
