// Reads and writes `deals` (SPEC.md §4.13, §5.3, §5.6, §9.2 Phase 3 "3.6") -
// the only file that talks to Supabase for deals (CLAUDE.md §3 "data access
// from the app goes through services/*"). Like bids.ts, this is online-only:
// accepting a bid is a trading action, never queued in the outbox
// (AGENTS.md §4).
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toAppError, rpcError, AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { lotKeys } from "@/services/lots";
import { bidKeys } from "@/services/bids";
import { AcceptBidInput, AcceptBidResult } from "@shared/schemas/deal.ts";
import type { Database } from "@/lib/database.types";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];

/** One deal, shaped for the farmer's lot-detail "Sold" card. No buyer
 * identity yet - `business_name` sits behind buyer_kyc's select-own RLS,
 * and 4.3/4.4 need it anyway; they can add a `lot_deal()` security definer
 * function the way 3.5 added `lot_bids()`. */
export type DealView = {
  id: string;
  pricePerQuintalPaise: number;
  quantityKg: number;
  totalPaise: number;
  feePaise: number;
  pickupDate: string;
};

function toDealView(row: DealRow): DealView {
  return {
    id: row.id,
    pricePerQuintalPaise: row.price_per_quintal_paise,
    quantityKg: row.quantity_kg,
    totalPaise: row.total_paise,
    feePaise: row.fee_paise,
    pickupDate: row.pickup_date,
  };
}

export const dealKeys = {
  forLot: (lotId: string) => ["deal", "lot", lotId] as const,
};

/**
 * Storage path for one deal's consent clip. The `{userId}/` folder is
 * exactly what the consent_audio_*_own RLS policies check, and what
 * accept_bid's own CONSENT_REQUIRED check enforces server-side too - same
 * pattern as photos.ts's cropPhotoPath().
 */
export function consentAudioPath(userId: string, bidId: string): string {
  return `${userId}/${bidId}.webm`;
}

/** Uploads the recorded consent clip to the `consent-audio` bucket.
 * ConsentPage calls this right before acceptBid(). */
export async function uploadConsentAudio(path: string, blob: Blob): Promise<void> {
  const { error } = await supabase.storage.from("consent-audio").upload(path, blob, {
    contentType: blob.type || "audio/webm",
    upsert: true,
  });
  if (error) throw new AppError("UPLOAD_FAILED", error.message);
}

async function acceptBid(input: AcceptBidInput): Promise<AcceptBidResult> {
  const parsed = AcceptBidInput.parse(input);
  const { data, error } = await supabase.rpc("accept_bid", {
    p_bid_id: parsed.bidId,
    p_consent_audio_path: parsed.consentAudioPath,
  });
  if (error) throw rpcError(error);
  const row = data?.[0];
  if (!row) throw rpcError(new Error("accept_bid returned no row"));
  return AcceptBidResult.parse({ dealId: row.deal_id });
}

/** ConsentPage's "I agree" button - uploads the clip then calls accept_bid,
 * invalidating everything the accept changes (the lot's status, its bids,
 * and its own deal). */
export function useAcceptBid(lotId: string) {
  return useMutation<AcceptBidResult, AppError, AcceptBidInput>({
    mutationFn: acceptBid,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lotKeys.byId(lotId) });
      void queryClient.invalidateQueries({ queryKey: bidKeys.forMyLot(lotId) });
      void queryClient.invalidateQueries({ queryKey: dealKeys.forLot(lotId) });
    },
  });
}

async function getDealForLot(lotId: string): Promise<DealView | null> {
  const { data, error } = await supabase.from("deals").select("*").eq("lot_id", lotId).maybeSingle();
  if (error) throw toAppError(error);
  return data ? toDealView(data) : null;
}

/** The deal for a sold lot, if any - LotDetailPage's "Sold" card. */
export function useDealForLot(lotId: string | undefined) {
  return useQuery({
    queryKey: dealKeys.forLot(lotId ?? ""),
    queryFn: () => getDealForLot(lotId as string),
    enabled: lotId !== undefined,
  });
}
