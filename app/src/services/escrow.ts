// Reads and writes `escrows` from the app side (SPEC.md §4.14, §5.4, §9.2
// Phase 4 "4.3"/"4.5") - the only file that calls the escrow-pay and
// delivery-code Edge Functions (CLAUDE.md §3 "data access from the app goes
// through services/*"). Paying is online-only, like deals.ts/bids.ts
// (AGENTS.md §4); reading the delivery code is not a money action, so it's
// a plain query, cached like any other read (SPEC §5.8) - the buyer can
// still see the code offline at the drop point once it's been fetched once.
import { useMutation, useQuery } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import { supabase } from "@/lib/supabase";
import { rpcError, type AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { dealKeys } from "@/services/deals";
import { khataKeys } from "@/services/khata";
import {
  EscrowPayInput,
  EscrowPayResult,
  DeliveryCodeInput,
  DeliveryCodeResult,
  MarkDispatchedInput,
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

/** mark_dispatched (SPEC §5.3, §9.2 Phase 4 "4.6") - a Postgres RPC, not an
 * Edge Function, called directly like accept_bid (deals.ts). Farmer-only,
 * online-only (AGENTS.md §4), never queued in the outbox. */
async function markDispatched(input: MarkDispatchedInput): Promise<void> {
  const parsed = MarkDispatchedInput.parse(input);
  const { error } = await supabase.rpc("mark_dispatched", { p_escrow_id: parsed.escrowId });
  if (error) throw rpcError(error);
}

/** LotDetailPage's "Mark dispatched" button - invalidates the deal (so the
 * Sold card flips to the blue "On the way" state) and the farmer's own
 * Khata (mark_dispatched writes a new blue row there too). */
export function useMarkDispatched(lotId: string) {
  return useMutation<void, AppError, MarkDispatchedInput>({
    mutationFn: markDispatched,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealKeys.forLot(lotId) });
      void queryClient.invalidateQueries({ queryKey: khataKeys.mine() });
    },
  });
}
