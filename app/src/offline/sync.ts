// Runs the outbox (SPEC.md §5.8 "Sync rules"): sends queued items to the
// server when online, in order, with backoff on failure. `handlers` is
// empty today - 1.7 (offline scan) registers the first real jobs
// (upload_blob, create_lot). Until then every item just waits; an item
// whose kind has no handler is left "pending" and doesn't burn a try.
import { db } from "./db";
import { afterFailure, pickNext, refreshOutboxSnapshot, type OutboxItem, type OutboxKind } from "./outbox";

type Handler = (payload: unknown) => Promise<void>;

const handlers: Partial<Record<OutboxKind, Handler>> = {};

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

/**
 * Runs on app start, when the network comes back, and every 60 s (SPEC.md
 * §5.8 rule 3 - simplified to "always poll"; an empty or not-yet-due queue
 * returns immediately, so this is the same thing with less bookkeeping).
 * Returns an unsubscribe function.
 */
export function startSync(): () => void {
  void runOutboxOnce();
  const onOnline = () => void runOutboxOnce();
  window.addEventListener("online", onOnline);
  const interval = setInterval(() => void runOutboxOnce(), POLL_MS);
  return () => {
    window.removeEventListener("online", onOnline);
    clearInterval(interval);
  };
}
