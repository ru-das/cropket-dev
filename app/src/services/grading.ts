// Calls the `grade` Edge Function once a scan's photos are uploaded
// (SPEC.md §5.4). offline/sync.ts runs requestGrade() for each queued
// "request_grade" job (queued by saveScanPhotos in photos.ts); the result
// is read back with useGradeResult() once grade_results is filled in.
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import { db } from "@/offline/db";
import { enqueue } from "@/offline/outbox";
import { GradeRequest } from "@shared/schemas/grade.ts";
import { Crop } from "@shared/crops.ts";
import type { Database } from "@/lib/database.types";

export type GradeResult = Database["public"]["Tables"]["grade_results"]["Row"];

export const gradeKeys = {
  byId: (id: string) => ["gradeResult", id] as const,
};

async function getGradeResult(id: string): Promise<GradeResult | null> {
  const { data, error } = await supabase.from("grade_results").select("*").eq("id", id).maybeSingle();
  if (error) throw toAppError(error);
  return data;
}

/**
 * The grade for one scan, or null while it's still pending (SPEC.md §4.6).
 * Polls every 5 s while there's no row yet or it's still "pending" - the
 * grade function runs from the outbox, not this hook, so this is how
 * ScanResultPage notices the answer without a Realtime channel for a
 * once-per-scan wait. Stops polling once the row is "done" or "failed".
 * TanStack Query already pauses fetches while offline on its own.
 */
export function useGradeResult(id: string | undefined) {
  return useQuery({
    queryKey: gradeKeys.byId(id ?? ""),
    queryFn: () => getGradeResult(id as string),
    enabled: id !== undefined,
    refetchInterval: (query) => {
      const row = query.state.data;
      return !row || row.status === "pending" ? 5_000 : false;
    },
  });
}

/**
 * Re-queues a grade request (the "Try again" on a failed grade, CLAUDE.md
 * §5). enqueue() upserts, so this also revives an outbox item that already
 * gave up after 10 tries (SPEC.md §5.8 rule 4) - it goes back to "pending"
 * with tries reset to 0.
 */
export async function retryGrade(gradeResultId: string): Promise<void> {
  await enqueue("request_grade", { gradeResultId }, gradeResultId);
}

const RequestGradePayload = z.object({ gradeResultId: z.string() });

type UploadedBlob = { uploadedPath?: string };

/**
 * The pure part of requestGrade: turns a draft's crop + its blobs into the
 * grade function's input. Throws UPLOAD_FAILED if any blob hasn't finished
 * uploading yet - the caller lets the outbox's normal backoff retry later,
 * once upload_blob (queued first, SPEC.md §5.8 rule 2) finishes.
 */
export function buildGradeRequest(
  gradeResultId: string,
  cropValue: unknown,
  blobs: UploadedBlob[],
): GradeRequest {
  const crop = Crop.parse(cropValue);
  const photoPaths = blobs.map((blob) => {
    if (!blob.uploadedPath) throw new AppError("UPLOAD_FAILED", "photo not uploaded yet");
    return blob.uploadedPath;
  });
  return GradeRequest.parse({ gradeResultId, crop, photoPaths });
}

type FunctionReply =
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string } };

/**
 * Sends one queued "request_grade" job. The draft's own id IS the
 * gradeResultId (SPEC.md §5.6 "made on the phone") - photos.ts only needs to
 * queue that one id, and this reads the crop and the uploaded photo paths
 * back out of Dexie itself.
 */
export async function requestGrade(payload: unknown): Promise<void> {
  const { gradeResultId } = RequestGradePayload.parse(payload);

  const draft = await db.drafts.get(gradeResultId);
  if (!draft) return; // already sent and swept, or never existed

  const blobs = await db.blobs.where("draftId").equals(gradeResultId).toArray();
  const input = buildGradeRequest(
    gradeResultId,
    (draft.payload as { crop?: unknown } | undefined)?.crop,
    blobs,
  );

  const { data, error, response } = await supabase.functions.invoke<FunctionReply>("grade", {
    body: input,
  });

  if (error) {
    // The grade function always answers with our own {ok:false,error:{code}}
    // body even on 4xx/5xx (CLAUDE.md §5) - supabase-js still treats a
    // non-2xx as a thrown error, so the code is read back out of the raw
    // response it attaches instead of out of `data`.
    const body = (await response?.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new AppError(body?.error?.code ?? "AI_UNAVAILABLE");
  }
  if (data && !data.ok) throw new AppError(data.error.code);
}
