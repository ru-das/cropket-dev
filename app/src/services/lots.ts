// Reads and writes Digital Lots (SPEC.md §5.6, §5.8, §9.2 Phase 1 "1.6") -
// the only file that talks to Supabase for `lots` (CLAUDE.md §3 "data
// access from the app goes through services/*"). Saving a lot always
// succeeds, online or off: NewLotPage calls saveLot(), which just queues a
// "create_lot" outbox job - there is no separate "drafts" row for a lot
// (unlike a scan's photos, a lot has no blob to point back at, so the
// outbox item *is* the pending lot; sendOne() in offline/sync.ts already
// deletes it once insertLot() below succeeds, so nothing extra needs
// cleaning up). insertLot() is that job's handler, registered in
// offline/sync.ts, run by the outbox runner - never called directly by a page.
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import { db } from "@/offline/db";
import { enqueue, useOutboxStatus } from "@/offline/outbox";
import { queryClient } from "@/offline/persist";
import { LotInput } from "@shared/schemas/lot.ts";
import { toPointWKT, type LatLng } from "@shared/geo.ts";
import { lotCode } from "@shared/lotCode.ts";
import type { Crop } from "@shared/crops.ts";
import type { Grade } from "@shared/schemas/grade.ts";
import type { Database } from "@/lib/database.types";

type LotRow = Database["public"]["Tables"]["lots"]["Row"];
export type LotStatus = LotRow["status"];

/**
 * One shape the UI renders whether the lot is a real server row or still
 * sitting in the outbox - LotCard/LotDetailPage never need to know which.
 * `pending: true` is what draws the "On phone only" chip.
 */
export type LotView = {
  id: string;
  crop: Crop;
  quantityKg: number;
  grade: Grade | null;
  gradeResultId: string | null;
  status: LotStatus;
  qrCode: string;
  pending: boolean;
  /** The create_lot outbox job gave up after 10 tries (milestone 1.7) - never true for a server row. */
  syncFailed: boolean;
  createdAt: string;
};

export const lotKeys = {
  mine: () => ["lots", "mine"] as const,
  // Both counts, so the list re-runs the moment an item flips to "failed",
  // not only when the unresolved count moves.
  pending: (unresolved: number, failed: number) => ["lots", "pending", unresolved, failed] as const,
  byId: (id: string) => ["lot", id] as const,
  photo: (gradeResultId: string) => ["lotPhoto", gradeResultId] as const,
};

function toServerLotView(row: LotRow): LotView {
  return {
    id: row.id,
    // crop/grade are `text` + check constraint in the DB, not a Postgres
    // enum, so the generated type is a plain string - same cast ScanResultPage
    // already does for grade_results.grade.
    crop: row.crop as Crop,
    quantityKg: row.quantity_kg,
    grade: row.grade as Grade | null,
    gradeResultId: row.grade_result_id,
    status: row.status,
    qrCode: row.qr_code,
    pending: false,
    syncFailed: false,
    createdAt: row.created_at,
  };
}

function toPendingLotView(input: LotInput, createdAtMs: number, syncFailed: boolean): LotView {
  return {
    id: input.id,
    crop: input.crop,
    quantityKg: input.quantityKg,
    grade: input.grade,
    gradeResultId: input.gradeResultId,
    status: "draft",
    qrCode: lotCode(input.id),
    pending: true,
    syncFailed,
    createdAt: new Date(createdAtMs).toISOString(),
  };
}

async function listMyLots(): Promise<LotView[]> {
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(toServerLotView);
}

/** Server lots, persisted to IndexedDB so My Lots reads offline (SPEC.md §5.8 "Reads"). */
export function useMyLots() {
  return useQuery({ queryKey: lotKeys.mine(), queryFn: listMyLots });
}

async function listPendingLots(): Promise<LotView[]> {
  // Not an indexed lookup (offline/db.ts only indexes id/status/nextTryAt/
  // createdAt on `outbox`) - the outbox is small, so filtering in memory is
  // simpler than adding an index for one query.
  const items = (await db.outbox.toArray()).filter((item) => item.kind === "create_lot");
  return items
    .map((item) => {
      const parsed = LotInput.safeParse(item.payload);
      return parsed.success
        ? toPendingLotView(parsed.data, item.createdAt, item.status === "failed")
        : null;
    })
    .filter((view): view is LotView => view !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lots still on the phone, not yet on the server. Empty once everything has synced. */
export function usePendingLots() {
  const { unresolved, failed } = useOutboxStatus();
  return useQuery({
    queryKey: lotKeys.pending(unresolved, failed),
    queryFn: listPendingLots,
  });
}

async function getLot(id: string): Promise<LotView | null> {
  // Checked first: right after Save, a lot may only exist as a pending
  // outbox item, and this is a direct primary-key read (no network needed).
  const pendingItem = await db.outbox.get(id);
  if (pendingItem?.kind === "create_lot") {
    const parsed = LotInput.safeParse(pendingItem.payload);
    if (parsed.success) {
      return toPendingLotView(parsed.data, pendingItem.createdAt, pendingItem.status === "failed");
    }
  }

  const { data, error } = await supabase.from("lots").select("*").eq("id", id).maybeSingle();
  if (error) throw toAppError(error);
  return data ? toServerLotView(data) : null;
}

/** One lot, pending or synced - lot detail works right after Save, with no wait for the server. */
export function useLot(id: string | undefined) {
  return useQuery({
    queryKey: lotKeys.byId(id ?? ""),
    queryFn: () => getLot(id as string),
    enabled: id !== undefined,
  });
}

/** Builds and validates what NewLotPage collected into the shape saveLot() queues. */
export function buildLotInput(params: {
  id: string;
  crop: Crop;
  quantityKg: number;
  gradeResultId: string | null;
  grade: Grade | null;
  location: LatLng | null;
}): LotInput {
  return LotInput.parse({ ...params, clientCreatedAt: new Date().toISOString() });
}

/** Queues a lot for saving. Always succeeds, online or off (SPEC.md §4.6 "saved on the phone as a draft"). */
export async function saveLot(input: LotInput): Promise<void> {
  await enqueue("create_lot", input, input.id);
}

/**
 * The "create_lot" outbox handler (registered in offline/sync.ts) - inserts
 * one lot. `on conflict do nothing` (SPEC.md §5.8 rule 1) makes a retry
 * after a half-sent attempt safe: it can never create a second lot for the
 * same id. Not called directly by any page.
 */
export async function insertLot(payload: unknown): Promise<void> {
  const input = LotInput.parse(payload);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AppError("NOT_SIGNED_IN");

  const { error } = await supabase.from("lots").upsert(
    {
      id: input.id,
      farmer_id: auth.user.id,
      crop: input.crop,
      quantity_kg: input.quantityKg,
      grade_result_id: input.gradeResultId,
      grade: input.grade,
      location: input.location ? toPointWKT(input.location) : null,
      qr_code: lotCode(input.id),
      client_created_at: input.clientCreatedAt,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw toAppError(error);

  // Moves the lot from "On phone only" to a real row with no reload - the
  // query client's staleTime (5 min) and refetchOnWindowFocus (off) mean
  // nobody would otherwise notice the sync happened.
  await queryClient.invalidateQueries({ queryKey: lotKeys.mine() });
  await queryClient.invalidateQueries({ queryKey: lotKeys.byId(input.id) });
}

/**
 * Flips a farmer's own graded draft to `listed` (SPEC.md §4.7 "Sell on
 * Cropket", §9.2 Phase 3 "3.2"). A single-row update, not an outbox job or
 * an RPC - listing isn't an all-or-nothing multi-table change, and CLAUDE.md
 * §3 keeps trading actions online-only, out of the outbox. RLS
 * (lots_update_own_list) is the real gate: own row, must be `draft`, must
 * already have a grade. 0 rows back means one of those didn't hold.
 */
export async function listLot(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("lots")
    .update({ status: "listed" })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw toAppError(error);
  if (!data) throw new AppError("LOT_NOT_LISTABLE");

  await queryClient.invalidateQueries({ queryKey: lotKeys.mine() });
  await queryClient.invalidateQueries({ queryKey: lotKeys.byId(id) });
}

/** Mutation wrapper for `listLot()` - LotDetailPage's "Sell on Cropket" button. */
export function useListLot() {
  return useMutation({ mutationFn: listLot });
}

async function lotPhotoUrl(gradeResultId: string): Promise<string | null> {
  const { data: grade } = await supabase
    .from("grade_results")
    .select("photo_paths")
    .eq("id", gradeResultId)
    .maybeSingle();
  const path = grade?.photo_paths?.[0];
  if (!path) return null;

  const { data, error } = await supabase.storage.from("crop-photos").createSignedUrl(path, 60);
  if (error) return null; // a missing thumbnail isn't worth failing the whole page over
  return data.signedUrl;
}

/** A signed URL for the lot's first scan photo, or null if there isn't one. */
export function useLotPhoto(gradeResultId: string | null | undefined) {
  return useQuery({
    queryKey: lotKeys.photo(gradeResultId ?? ""),
    queryFn: () => lotPhotoUrl(gradeResultId as string),
    enabled: Boolean(gradeResultId),
    staleTime: 50_000, // the signed URL itself expires at 60 s
  });
}
