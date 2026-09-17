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

// A retry can only ever fix something that was actually transient - being
// offline, a photo still mid-upload (SPEC.md §5.8 rule 2's ordering wait),
// or an AI service asleep (a free Hugging Face Space, 502). Everything else
// - a bad token, wrong role, bad input - will fail the exact same way on
// try 10 as it did on try 1, so burning 10 backoff rounds on it only makes
// a real rejection (CLAUDE.md §5 "Honesty rule") look like bad signal.
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "UPLOAD_FAILED", "AI_UNAVAILABLE"]);

/** True if `code` (an AppError code, or "UNKNOWN") is worth a retry. */
export function isRetryable(code: string): boolean {
  return RETRYABLE_CODES.has(code);
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

/**
 * What an item's row should become after a failed send attempt. `code` is
 * the AppError code the handler threw (or "UNKNOWN") - a non-retryable code
 * goes straight to "failed" on the very first try, same as hitting
 * MAX_TRIES, instead of waiting out the whole backoff schedule first.
 */
export function afterFailure(
  item: OutboxItem,
  now: number,
  code: string,
): Pick<OutboxItem, "status" | "tries" | "nextTryAt"> {
  const tries = item.tries + 1;
  if (tries >= MAX_TRIES || !isRetryable(code)) {
    return { status: "failed", tries, nextTryAt: item.nextTryAt };
  }
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

// --- live outbox snapshot, for the header (SyncStatus) and the shared
// "something needs attention" strip (SyncTrouble, milestone 1.7) ---

export type OutboxSnapshot = {
  /** pending + sending - what SyncStatus already showed before 1.7. */
  unresolved: number;
  /** gave up after MAX_TRIES - SyncTrouble's "Try again" button. */
  failed: number;
  /** createdAt of the oldest unresolved item, or null if none - the 24 h warning. */
  oldestPendingAt: number | null;
};

const EMPTY_SNAPSHOT: OutboxSnapshot = { unresolved: 0, failed: 0, oldestPendingAt: null };

/** Pure - builds the whole snapshot from a plain array, no Dexie needed to test it. */
export function summarizeOutbox(items: OutboxItem[]): OutboxSnapshot {
  let unresolved = 0;
  let failed = 0;
  let oldestPendingAt: number | null = null;
  for (const item of items) {
    if (item.status === "failed") {
      failed++;
    } else {
      unresolved++;
      if (oldestPendingAt === null || item.createdAt < oldestPendingAt) {
        oldestPendingAt = item.createdAt;
      }
    }
  }
  return { unresolved, failed, oldestPendingAt };
}

// ponytail: no count survives past this snapshot (SyncStatus/SyncTrouble show
// plain words like "Some things did not save", not "2 things") - a session
// running total ("Uploading 2 of 3" that actually counts up) was dropped back
// in 0.6b for the same reason: nothing needed it yet. summarizeOutbox already
// counts everything, so add the display later with no new plumbing.
let snapshot: OutboxSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function sameSnapshot(a: OutboxSnapshot, b: OutboxSnapshot): boolean {
  return a.unresolved === b.unresolved && a.failed === b.failed && a.oldestPendingAt === b.oldestPendingAt;
}

export async function refreshOutboxSnapshot(): Promise<void> {
  const next = summarizeOutbox(await db.outbox.toArray());
  if (sameSnapshot(next, snapshot)) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** The live outbox snapshot. `unresolved === 0 && failed === 0` means nothing to show. */
export function useOutboxStatus(): OutboxSnapshot {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => snapshot,
  );
}

/**
 * Re-queues every failed item (SPEC.md §5.8 rule 4 "shown to the user with a
 * 'Try again' button") - back to pending, tries reset, due now. The existing
 * subscribeOutbox -> runOutboxOnce() wiring (1.6) means sending restarts
 * right away once something is online to send it.
 */
export async function retryFailed(): Promise<void> {
  await db.outbox.where("status").equals("failed").modify({ status: "pending", tries: 0, nextTryAt: Date.now() });
  await refreshOutboxSnapshot();
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
