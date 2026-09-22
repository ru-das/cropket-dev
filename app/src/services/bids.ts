// Reads and writes bids on a lot or a mega lot (SPEC.md §5.3, §5.6, §9.2
// Phase 3 "3.3", mega_lot target added in "3.4") - the only file that talks
// to Supabase for `bids` (CLAUDE.md §3 "data access from the app goes
// through services/*"). Bidding is online-only (AGENTS.md §4 "money and
// trading actions are never put in the outbox"), so unlike lots.ts there is
// no draft/pending shape here - placeBid() either reaches the server or
// throws.
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { rpcError, toAppError, AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { BidInput, BidResult, type BidTargetType } from "@shared/schemas/bid.ts";
import type { Database } from "@/lib/database.types";

type BidRow = Pick<
  Database["public"]["Tables"]["bids"]["Row"],
  "id" | "price_per_quintal_paise" | "created_at"
>;

const TARGET_COLUMN: Record<BidTargetType, "lot_id" | "mega_lot_id"> = {
  lot: "lot_id",
  mega_lot: "mega_lot_id",
};

/** One bid, shaped for LiveBidBox's recent-bids list. No buyer identity on
 * purpose - LiveBidBox shows price + time only, never a rival bidder's
 * business name (buyer_kyc stays select-own + admin-only). */
export type BidView = {
  id: string;
  pricePerQuintalPaise: number;
  createdAt: string;
};

export const bidKeys = {
  forTarget: (targetType: BidTargetType, targetId: string) => ["bids", targetType, targetId] as const,
};

function toBidView(row: BidRow): BidView {
  return { id: row.id, pricePerQuintalPaise: row.price_per_quintal_paise, createdAt: row.created_at };
}

async function listTargetBids(targetType: BidTargetType, targetId: string): Promise<BidView[]> {
  const { data, error } = await supabase
    .from("bids")
    .select("id, price_per_quintal_paise, created_at")
    .eq(TARGET_COLUMN[targetType], targetId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(toBidView);
}

/** Every active bid on one lot or mega lot, newest first - RLS
 * (bids_select_listed / bids_select_mega_listed) already scopes this to a
 * target that is actually listed. */
export function useLotBids(targetType: BidTargetType, targetId: string | undefined) {
  return useQuery({
    queryKey: bidKeys.forTarget(targetType, targetId ?? ""),
    queryFn: () => listTargetBids(targetType, targetId as string),
    enabled: targetId !== undefined,
  });
}

/** The current top bid, or null when nobody has bid yet. */
export function highestBid(bids: BidView[]): BidView | null {
  return bids.reduce<BidView | null>(
    (best, bid) => (best === null || bid.pricePerQuintalPaise > best.pricePerQuintalPaise ? bid : best),
    null,
  );
}

/**
 * Subscribes to `bids:lot:{id}` / `bids:mega:{id}` (SPEC.md §5.6 realtime
 * channel names) and refetches useLotBids() on every new bid - the first
 * Realtime code in this project, kept deliberately plain since M4's
 * `escrow:{dealId}` copies this shape. RLS still filters what actually
 * arrives on the channel.
 */
export function useLotBidsRealtime(targetType: BidTargetType, targetId: string | undefined) {
  useEffect(() => {
    if (!targetId) return;
    const channelName = targetType === "lot" ? `bids:lot:${targetId}` : `bids:mega:${targetId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `${TARGET_COLUMN[targetType]}=eq.${targetId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: bidKeys.forTarget(targetType, targetId) }),
      )
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [targetType, targetId]);
}

async function placeBid(input: BidInput): Promise<BidResult> {
  const parsed = BidInput.parse(input);
  const { data, error } = await supabase.rpc("place_bid", {
    p_target_type: parsed.targetType,
    p_target_id: parsed.targetId,
    p_price_per_quintal_paise: parsed.pricePerQuintalPaise,
  });
  if (error) throw rpcError(error);
  const row = data?.[0];
  if (!row) throw rpcError(new Error("place_bid returned no row"));
  return BidResult.parse({ bidId: row.bid_id, isHighest: row.is_highest, belowFloor: row.below_floor });
}

/** Mutation wrapper for `placeBid()` - LiveBidBox's bid form. */
export function usePlaceBid() {
  return useMutation<BidResult, AppError, BidInput>({
    mutationFn: placeBid,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: bidKeys.forTarget(input.targetType, input.targetId) });
    },
  });
}
