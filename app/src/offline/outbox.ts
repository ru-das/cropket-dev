// The offline write queue (SPEC.md §5.8 "Writes"). Money and trading actions
// are never queued (CLAUDE.md §3) - assertAllowedKind is the guard that
// keeps that true even for an untyped caller. offline/sync.ts is the runner
// that actually sends these; this file is the queue plus the pure retry
// policy, so the policy is unit-testable with no Dexie/React involved.
import { useSyncExternalStore } from "react";
import { db } from "./db";

export const OUTBOX_KINDS = [
  "upload_blob",
  "create_lot",
  "request_grade",
  "create_crates",
  "rate_deal",
  "create_ticket",
] as const;
export type OutboxKind = (typeof OUTBOX_KINDS)[number];

// No "done" here - a sent item is deleted from the table, not kept around
// (SPEC.md §5.8's table originally listed "done" too; fixed there in the
// same change, since nothing can ever hold that value with this design).
export type OutboxStatus = "pending" | "sending" | "failed";

export type OutboxItem = {
  id: string;
  kind: OutboxKind;
  payload: unknown;
  status: OutboxStatus;
  tries: number;
  nextTryAt: number;
  lastError?: string;
  createdAt: number;
};

const KIND_SET = new Set<string>(OUTBOX_KINDS);

/** Throws for any kind not on the allow-list - the guard against queuing money/trading actions. */
export function assertAllowedKind(kind: string): asserts kind is OutboxKind {
  if (!KIND_SET.has(kind)) throw new Error(`OUTBOX_KIND_NOT_ALLOWED: ${kind}`);
}

// SPEC.md §5.8 rule 4: "Retries use backoff (5 s, 30 s, 2 min, 10 min, then every 30 min).
// After 10 failures an item is marked failed."
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000];
const REPEAT_DELAY_MS = 30 * 60 * 1000;
export const MAX_TRIES = 10;

/** Delay before the attempt numbered `tries` (1st failure -> tries=1 -> 5 s, ...). */
export function nextTryDelayMs(tries: number): number {
  return RETRY_DELAYS_MS[tries - 1] ?? REPEAT_DELAY_MS;
}

/**
 * The oldest ready item (status "pending", due now), or null. Ordering by
 * `createdAt` is what keeps a photo ahead of the lot that uses it (SPEC.md
 * §5.8 rule 2).
 */
export function pickNext(items: OutboxItem[], now: number): OutboxItem | null {
  const ready = items.filter((item) => item.status === "pending" && item.nextTryAt <= now);
  ready.sort((a, b) => a.createdAt - b.createdAt);
  return ready[0] ?? null;
}

/** What an item's row should become after a failed send attempt. */
export function afterFailure(
  item: OutboxItem,
  now: number,
): Pick<OutboxItem, "status" | "tries" | "nextTryAt"> {
  const tries = item.tries + 1;
  if (tries >= MAX_TRIES) return { status: "failed", tries, nextTryAt: item.nextTryAt };
  return { status: "pending", tries, nextTryAt: now + nextTryDelayMs(tries) };
}

/** Adds a job to the outbox. IDs are made on the phone (SPEC.md §5.8 rule 1). */
export async function enqueue(
  kind: OutboxKind,
  payload: unknown,
  id: string = crypto.randomUUID(),
): Promise<void> {
  assertAllowedKind(kind);
  const now = Date.now();
  await db.outbox.put({ id, kind, payload, status: "pending", tries: 0, nextTryAt: now, createdAt: now });
  await refreshOutboxSnapshot();
}

// --- live "how many still need to go" count, for the header (SyncStatus) ---

// ponytail: counts only unresolved (pending/sending) items - a failed item
// drops out of this count and isn't shown in the header at all yet. A
// "Try again" button for failed items belongs on the screen where they're
// actually visible (My Lots etc.), which lands with the first real job in
// milestone 1.7 - add it there, not here.
let unresolvedCount = 0;
const listeners = new Set<() => void>();

export async function refreshOutboxSnapshot(): Promise<void> {
  const next = await db.outbox.where("status").anyOf("pending", "sending").count();
  if (next === unresolvedCount) return;
  unresolvedCount = next;
  listeners.forEach((listener) => listener());
}

/** Items still waiting to reach the server. 0 means nothing to sync. */
export function useOutboxStatus(): number {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => unresolvedCount,
  );
}

/**
 * Runs `callback` whenever the unresolved count changes (same listener set
 * as useOutboxStatus). offline/sync.ts uses this so a newly queued item -
 * "create_lot" saved offline, a photo, a grade request - is sent right away
 * when there's a connection, instead of waiting for the 60 s poll.
 */
export function subscribeOutbox(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
