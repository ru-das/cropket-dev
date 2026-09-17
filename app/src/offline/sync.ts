// Runs the outbox (SPEC.md §5.8 "Sync rules"): sends queued items to the
// server when online, in order, with backoff on failure. `handlers` got its
// first real job in 1.2 (upload_blob); 1.3 added request_grade; 1.6 adds
// create_lot the same way. An item whose kind has no handler yet is left
// "pending" and doesn't burn a try.
import { db } from "./db";
import {
  afterFailure,
  pickNext,
  refreshOutboxSnapshot,
  subscribeOutbox,
  type OutboxItem,
  type OutboxKind,
} from "./outbox";
import { uploadCropPhoto } from "@/services/photos";
import { requestGrade } from "@/services/grading";
import { insertLot } from "@/services/lots";

type Handler = (payload: unknown) => Promise<void>;

const handlers: Partial<Record<OutboxKind, Handler>> = {
  upload_blob: uploadCropPhoto,
  request_grade: requestGrade,
  create_lot: insertLot,
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

// Guards against the online event, the 60 s poll and the outbox
// subscription below all firing runOutboxOnce() at once - without this, two
// overlapping runs could both read the same "pending" item before either
// marks it "sending" and send it twice.
let running = false;

/** Sends every ready item once, in order. Stops (without failing) at the first kind with no handler yet. */
export async function runOutboxOnce(): Promise<void> {
  if (!navigator.onLine || running) return;
  running = true;
  try {
    for (;;) {
      const items = await db.outbox.where("status").equals("pending").toArray();
      const next = pickNext(items, Date.now());
      if (!next) return;
      const handler = handlers[next.kind];
      if (!handler) return; // nothing registered for this kind yet
      await sendOne(next, handler);
    }
  } finally {
    running = false;
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
 * Runs on app start, when the network comes back, every 60 s (SPEC.md §5.8
 * rule 3 - simplified to "always poll"; an empty or not-yet-due queue
 * returns immediately, so this is the same thing with less bookkeeping),
 * and the moment something new is queued - so a lot saved while online
 * reaches the server in about a second, not up to a minute later (1.6).
 * Returns an unsubscribe function.
 */
export function startSync(): () => void {
  void runOutboxOnce();
  void sweepExpiredBlobs();
  const onOnline = () => void runOutboxOnce();
  window.addEventListener("online", onOnline);
  const interval = setInterval(() => void runOutboxOnce(), POLL_MS);
  const unsubscribeOutbox = subscribeOutbox(() => void runOutboxOnce());
  return () => {
    window.removeEventListener("online", onOnline);
    clearInterval(interval);
    unsubscribeOutbox();
  };
}
