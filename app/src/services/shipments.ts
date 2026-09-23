// Reads/writes `shipments` from the app side (SPEC.md §4.16, §5.4, §5.6,
// §9.2 Phase 4 "4.7") - the only file that calls `shipments-create`
// (CLAUDE.md §3 "data access from the app goes through services/*"). The
// trip link itself never gets stored anywhere (only its hash is, in
// `shipments.trip_token_hash`) - it lives only in this mutation's own
// result, in memory, same reasoning services/escrow.ts gives for the
// delivery code being a plain derived read instead.
import { useMutation, useQuery } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import { supabase } from "@/lib/supabase";
import { toAppError, type AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { ShipmentCreateInput, ShipmentCreateResult } from "@shared/schemas/shipment.ts";

export type ShipmentView = {
  id: string;
  driverPhone: string;
  vehicleNumber: string;
};

export const shipmentKeys = {
  forDeal: (dealId: string) => ["shipment", "deal", dealId] as const,
};

async function getShipmentForDeal(dealId: string): Promise<ShipmentView | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("id, driver_phone, vehicle_number")
    .eq("deal_id", dealId)
    .maybeSingle();
  if (error) throw toAppError(error);
  if (!data) return null;
  return { id: data.id, driverPhone: data.driver_phone, vehicleNumber: data.vehicle_number };
}

/** DriverLinkCard - whether a shipment already exists for this deal, so a
 * reload still shows "Driver link made for MH15AB1234" instead of an empty
 * form (the link itself is gone from memory by then - "Make a new link"
 * is how the farmer gets a working one back). */
export function useShipmentForDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: shipmentKeys.forDeal(dealId ?? ""),
    queryFn: () => getShipmentForDeal(dealId as string),
    enabled: dealId !== undefined,
  });
}

async function createShipment(input: ShipmentCreateInput): Promise<ShipmentCreateResult> {
  const parsed = ShipmentCreateInput.parse(input);
  const result = await callFunction<ShipmentCreateResult>("shipments-create", parsed);
  return ShipmentCreateResult.parse(result);
}

/** DriverLinkCard's "Send link to driver" / "Make a new link" button - both
 * the same call (shipments-create upserts on deal_id and rotates the
 * token), so a second tap always makes a fresh working link even if the
 * first one was never opened. */
export function useCreateShipment(dealId: string) {
  return useMutation<ShipmentCreateResult, AppError, ShipmentCreateInput>({
    mutationFn: createShipment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shipmentKeys.forDeal(dealId) });
    },
  });
}
