// Saves crop scan photos on the phone and uploads them to the `crop-photos`
// bucket (CLAUDE.md §3 "data access from the app goes through services/*").
// SmartFrameCamera (components/camera) hands 3 blobs to saveScanPhotos();
// offline/sync.ts calls uploadCropPhoto() when a queued upload_blob job runs
// - this file never talks to Dexie's outbox runner itself, just the queue.
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import { db } from "@/offline/db";
import { enqueue } from "@/offline/outbox";

/**
 * Storage path for one crop photo. The `{userId}/` folder is exactly what
 * the crop_photos_*_own RLS policies check (supabase/migrations/
 * *_crop_photos_bucket.sql) - getting this wrong means uploads fail closed,
 * not open.
 */
export function cropPhotoPath(userId: string, blobId: string): string {
  return `${userId}/${blobId}.jpg`;
}

const UploadBlobPayload = z.object({ blobId: z.string() });

/**
 * Saves a scan's photos as a draft + blobs on the phone, then queues each
 * for upload. Blobs are enqueued in shot order (SPEC.md §5.8 rule 2: a photo
 * upload finishes before the grade request that will use it, once 1.3/1.7
 * add that job). Returns the new draft id.
 */
export async function saveScanPhotos(crop: string, photos: Blob[]): Promise<string> {
  const draftId = crypto.randomUUID();
  await db.drafts.put({ id: draftId, kind: "grade", payload: { crop }, createdAt: Date.now() });
  for (const data of photos) {
    const blobId = crypto.randomUUID();
    await db.blobs.put({ id: blobId, draftId, kind: "photo", data });
    // The outbox item id matches the blob id - a re-queued item never
    // duplicates (db.outbox.put is an upsert), and it doubles as the lookup
    // key uploadCropPhoto needs.
    await enqueue("upload_blob", { blobId } satisfies z.infer<typeof UploadBlobPayload>, blobId);
  }
  return draftId;
}

/** Uploads one queued photo blob to `crop-photos`. Called by offline/sync.ts. */
export async function uploadCropPhoto(payload: unknown): Promise<void> {
  const { blobId } = UploadBlobPayload.parse(payload);
  const row = await db.blobs.get(blobId);
  if (!row) return; // already uploaded and swept (7-day cleanup), or never existed

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AppError("NOT_SIGNED_IN");

  const path = cropPhotoPath(auth.user.id, blobId);
  // upsert: true makes a retry after a half-failed attempt safe (SPEC.md
  // §5.8 rule 1) - needs the update policy in the bucket migration too.
  const { error } = await supabase.storage.from("crop-photos").upload(path, row.data, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new AppError("UPLOAD_FAILED", error.message);
  await db.blobs.update(blobId, { uploadedPath: path }).catch((err: unknown) => {
    throw toAppError(err);
  });
}
