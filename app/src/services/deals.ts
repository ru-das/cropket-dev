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
import type { Crop } from "@shared/crops.ts";
import type { Database } from "@/lib/database.types";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];

/** One deal, shaped for the farmer's lot-detail "Sold" card. No buyer
 * identity yet - `business_name` sits behind buyer_kyc's select-own RLS,
 * and 4.4 needs it anyway; it can add a `lot_deal()` security definer
 * function the way 3.5 added `lot_bids()`. `escrowState` is null only for
 * the instant between accept_bid's return and this query's next read -
 * accept_bid (4.1) always creates the escrow in the same transaction. */
export type DealView = {
  id: string;
  pricePerQuintalPaise: number;
  quantityKg: number;
  totalPaise: number;
  feePaise: number;
  pickupDate: string;
  escrowState: Database["public"]["Enums"]["escrow_state"] | null;
};

function toDealView(row: DealRow, escrowState: Database["public"]["Enums"]["escrow_state"] | null): DealView {
  return {
    id: row.id,
    pricePerQuintalPaise: row.price_per_quintal_paise,
    quantityKg: row.quantity_kg,
    totalPaise: row.total_paise,
    feePaise: row.fee_paise,
    pickupDate: row.pickup_date,
    escrowState,
  };
}

export const dealKeys = {
  forLot: (lotId: string) => ["deal", "lot", lotId] as const,
  mine: () => ["deal", "mine"] as const,
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
  return AcceptBidResult.parse({ dealId: row.deal_id, escrowId: row.escrow_id });
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
  if (!data) return null;

  // Two simple queries, not an embedded select - escrows has no FK back to
  // deals in the generated Relationships (the FK is the other way round,
  // deals has none to escrows), so there's no `deals.select("*, escrows(state)")`
  // to reach for; escrow-pay/index.ts reads the same two tables the same way.
  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("state")
    .eq("deal_id", data.id)
    .maybeSingle();
  if (escrowError) throw toAppError(escrowError);

  return toDealView(data, escrow?.state ?? null);
}

/** The deal for a sold lot, if any - LotDetailPage's "Sold" card. */
export function useDealForLot(lotId: string | undefined) {
  return useQuery({
    queryKey: dealKeys.forLot(lotId ?? ""),
    queryFn: () => getDealForLot(lotId as string),
    enabled: lotId !== undefined,
  });
}

/** One of the buyer's own deals, shaped for BuyerHome's "My deals" list
 * and BuyerDealPage's pay screen (SPEC.md §4.14, §9.2 Phase 4 "4.3"). */
export type BuyerDealView = {
  dealId: string;
  escrowId: string;
  escrowState: Database["public"]["Enums"]["escrow_state"];
  escrowTotalPaise: number;
  lotId: string;
  crop: Crop;
  grade: string | null;
  qrCode: string;
  quantityKg: number;
  pricePerQuintalPaise: number;
  totalPaise: number;
  feePaise: number;
  pickupDate: string;
};

type BuyerDealRow = Database["public"]["Functions"]["buyer_deals"]["Returns"][number];

function toBuyerDealView(row: BuyerDealRow): BuyerDealView {
  return {
    dealId: row.deal_id,
    escrowId: row.escrow_id,
    escrowState: row.escrow_state,
    escrowTotalPaise: row.escrow_total_paise,
    lotId: row.lot_id,
    crop: row.crop as Crop,
    grade: row.grade,
    qrCode: row.qr_code,
    quantityKg: row.quantity_kg,
    pricePerQuintalPaise: row.price_per_quintal_paise,
    totalPaise: row.total_paise,
    feePaise: row.fee_paise,
    pickupDate: row.pickup_date,
  };
}

async function getBuyerDeals(): Promise<BuyerDealView[]> {
  const { data, error } = await supabase.rpc("buyer_deals");
  if (error) throw toAppError(error);
  return (data ?? []).map(toBuyerDealView);
}

/** The signed-in buyer's own deals, best (most recent) first - BuyerHome's
 * "My deals" list. */
export function useBuyerDeals() {
  return useQuery({ queryKey: dealKeys.mine(), queryFn: getBuyerDeals });
}
