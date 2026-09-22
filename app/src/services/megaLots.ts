// Reads mega lots (SPEC.md §5.6, §9.2 Phase 3 "3.4") - the only file that
// talks to Supabase for `mega_lots`/`mega_lot_items` (CLAUDE.md §3 "data
// access from the app goes through services/*"). There's no write path
// here on purpose: grouping only ever happens through group_mega_lots()
// (the trigger in 20260922170000_mega_lots.sql), never from the app.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errors";
import type { Crop } from "@shared/crops.ts";
import type { Grade } from "@shared/schemas/grade.ts";
import type { MarketLot } from "@/routes/buyer/marketplace";

export const megaLotKeys = {
  market: () => ["megaLots", "market"] as const,
  byId: (id: string) => ["megaLot", id] as const,
  items: (id: string) => ["megaLot", id, "items"] as const,
};

export type MegaLotItemView = {
  lotId: string;
  farmerId: string;
  quantityKg: number;
  grade: Grade | null;
  gradeResultId: string | null;
};

async function listMarketMegaLots(): Promise<MarketLot[]> {
  const { data, error } = await supabase
    .from("mega_lots")
    .select("id, crop, grade, total_kg, lat, lng, created_at, mega_lot_items(count)")
    .eq("status", "listed")
    .order("created_at", { ascending: false })
    .limit(200); // same one-page cap as useListedLots(), see marketplace.ts's header comment
  if (error) throw toAppError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: "mega" as const,
    crop: row.crop as Crop,
    grade: row.grade as Grade,
    quantityKg: row.total_kg,
    gradeResultId: null,
    farmerCount: row.mega_lot_items[0]?.count ?? 0,
    location: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null,
    createdAt: row.created_at,
  }));
}

/** Every listed mega lot - merged into the buyer marketplace grid alongside single lots. */
export function useListedMegaLots() {
  return useQuery({ queryKey: megaLotKeys.market(), queryFn: listMarketMegaLots });
}

async function getMegaLot(id: string): Promise<MarketLot | null> {
  const { data, error } = await supabase
    .from("mega_lots")
    .select("id, crop, grade, total_kg, lat, lng, created_at, mega_lot_items(count)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw toAppError(error);
  if (!data) return null;

  return {
    id: data.id,
    kind: "mega",
    crop: data.crop as Crop,
    grade: data.grade as Grade,
    quantityKg: data.total_kg,
    gradeResultId: null,
    farmerCount: data.mega_lot_items[0]?.count ?? 0,
    location: data.lat !== null && data.lng !== null ? { lat: data.lat, lng: data.lng } : null,
    createdAt: data.created_at,
  };
}

/** One mega lot - BuyerMegaLotDetailPage's header + LiveBidBox. */
export function useMegaLot(id: string | undefined) {
  return useQuery({
    queryKey: megaLotKeys.byId(id ?? ""),
    queryFn: () => getMegaLot(id as string),
    enabled: id !== undefined,
  });
}

async function listMegaLotItems(megaLotId: string): Promise<MegaLotItemView[]> {
  const { data, error } = await supabase
    .from("mega_lot_items")
    .select("lot_id, farmer_id, quantity_kg, lots(grade, grade_result_id)")
    .eq("mega_lot_id", megaLotId);
  if (error) throw toAppError(error);

  // Never a farmer's name here - the member-lot list shows kg and grade
  // only (same call 3.3 made for a rival bidder's identity in LiveBidBox).
  return (data ?? []).map((row) => ({
    lotId: row.lot_id,
    farmerId: row.farmer_id,
    quantityKg: row.quantity_kg,
    grade: (row.lots?.grade ?? null) as Grade | null,
    gradeResultId: row.lots?.grade_result_id ?? null,
  }));
}

/** The member lots of one mega lot - BuyerMegaLotDetailPage's member list + photo strip. */
export function useMegaLotItems(megaLotId: string | undefined) {
  return useQuery({
    queryKey: megaLotKeys.items(megaLotId ?? ""),
    queryFn: () => listMegaLotItems(megaLotId as string),
    enabled: megaLotId !== undefined,
  });
}
