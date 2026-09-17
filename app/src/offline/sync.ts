// Runs the outbox (SPEC.md §5.8 "Sync rules"): sends queued items to the
// server when online, in order, with backoff on failure. `handlers` got its
// first real job in 1.2 (upload_blob); 1.3 adds request_grade; 1.6/1.7 add
// create_lot the same way. An item whose kind has no handler yet is left
// "pending" and doesn't burn a try.
import { db } from "./db";
import {
  afterFailure,
  pickNext,
  refreshOutboxSnapshot,
  type OutboxItem,
  type OutboxKind,
} from "./outbox";
import { uploadCropPhoto } from "@/services/photos";
import { requestGrade } from "@/services/grading";

type Handler = (payload: unknown) => Promise<void>;

const handlers: Partial<Record<OutboxKind, Handler>> = {
  upload_blob: uploadCropPhoto,
  request_grade: requestGrade,
};

async function sendOne(item: OutboxItem, handler: Handler): Promise<void> {
  await db.outbox.update(item.id, { status: "sending" });
  try {
    await handler(item.payload);
    await db.outbox.delete(item.id);
  } catch (err) {
    const patch = afterFailure(item, Date.now());
    await db.outbox.update(item.id, {
      ...patch,
      lastError: err instanceof Error ? err.message : String(err),
    });
  }
  await refreshOutboxSnapshot();
}

/** Sends every ready item once, in order. Stops (without failing) at the first kind with no handler yet. */
export async function runOutboxOnce(): Promise<void> {
  if (!navigator.onLine) return;
  for (;;) {
    const items = await db.outbox.where("status").equals("pending").toArray();
    const next = pickNext(items, Date.now());
    if (!next) return;
    const handler = handlers[next.kind];
    if (!handler) return; // nothing registered for this kind yet (1.7+)
    await sendOne(next, handler);
  }
}

const POLL_MS = 60_000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * True once a blob is both uploaded and its draft is 7+ days old (SPEC.md
 * §5.8 rule 6: "uploaded blobs are deleted from the phone after 7 days" -
 * the copy in Storage is already safe, this is just freeing space on the
 * phone). Pure so the boundary is unit-testable with no Dexie involved.
 */
export function isExpiredBlob(
  uploadedPath: string | undefined,
  draftCreatedAt: number,
  now: number,
): boolean {
  return uploadedPath !== undefined && now - draftCreatedAt >= SEVEN_DAYS_MS;
}

/** Deletes blobs that are safe to forget (SPEC.md §5.8 rule 6). Local-only, needs no network. */
async function sweepExpiredBlobs(): Promise<void> {
  const now = Date.now();
  for (const blob of await db.blobs.toArray()) {
    if (!blob.uploadedPath) continue; // still needs to reach the server - never sweep that
    const draft = await db.drafts.get(blob.draftId);
    // No draft left to point back to it is treated as expired too - an
    // orphan blob that's already uploaded has nothing left to wait for.
    if (!draft || isExpiredBlob(blob.uploadedPath, draft.createdAt, now)) {
      await db.blobs.delete(blob.id);
    }
  }
}

/**
 * Runs on app start, when the network comes back, and every 60 s (SPEC.md
 * §5.8 rule 3 - simplified to "always poll"; an empty or not-yet-due queue
 * returns immediately, so this is the same thing with less bookkeeping).
 * Returns an unsubscribe function.
 */
export function startSync(): () => void {
  void runOutboxOnce();
  void sweepExpiredBlobs();
  const onOnline = () => void runOutboxOnce();
  window.addEventListener("online", onOnline);
  const interval = setInterval(() => void runOutboxOnce(), POLL_MS);
  return () => {
    window.removeEventListener("online", onOnline);
    clearInterval(interval);
  };
}
