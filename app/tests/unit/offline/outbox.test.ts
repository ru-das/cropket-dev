// CLAUDE.md §6 "Outbox / sync": order kept (photo before lot), backoff
// times, failed after 10 tries, money kinds rejected. All pure - no Dexie,
// no React (SPEC.md §5.8).
import { describe, expect, it } from "vitest";
import {
  afterFailure,
  assertAllowedKind,
  isRetryable,
  MAX_TRIES,
  nextTryDelayMs,
  pickNext,
  summarizeOutbox,
  type OutboxItem,
} from "@/offline/outbox";

function item(overrides: Partial<OutboxItem> = {}): OutboxItem {
  return {
    id: "id",
    kind: "create_lot",
    payload: {},
    status: "pending",
    tries: 0,
    nextTryAt: 0,
    createdAt: 0,
    ...overrides,
  };
}

describe("nextTryDelayMs", () => {
  it("follows the SPEC.md §5.8 backoff schedule", () => {
    expect(nextTryDelayMs(1)).toBe(5_000);
    expect(nextTryDelayMs(2)).toBe(30_000);
    expect(nextTryDelayMs(3)).toBe(120_000);
    expect(nextTryDelayMs(4)).toBe(600_000);
    expect(nextTryDelayMs(5)).toBe(1_800_000);
    expect(nextTryDelayMs(9)).toBe(1_800_000);
  });
});

describe("isRetryable", () => {
  it("retries the transient codes: offline, mid-upload, AI service asleep", () => {
    for (const code of ["NETWORK_ERROR", "UPLOAD_FAILED", "AI_UNAVAILABLE"]) {
      expect(isRetryable(code)).toBe(true);
    }
  });

  it("never retries an auth, role or validation rejection - it fails the same way every time", () => {
    for (const code of ["UNAUTHENTICATED", "FORBIDDEN", "VALIDATION_FAILED", "UNKNOWN"]) {
      expect(isRetryable(code)).toBe(false);
    }
  });
});

describe("afterFailure", () => {
  it("stays pending with a growing nextTryAt before try 10, for a retryable code", () => {
    const result = afterFailure(item({ tries: 8, nextTryAt: 0 }), 1_000, "NETWORK_ERROR");
    expect(result.status).toBe("pending");
    expect(result.tries).toBe(9);
    expect(result.nextTryAt).toBe(1_000 + nextTryDelayMs(9));
  });

  it("becomes failed at the 10th try", () => {
    const result = afterFailure(item({ tries: MAX_TRIES - 1 }), 1_000, "NETWORK_ERROR");
    expect(result.status).toBe("failed");
    expect(result.tries).toBe(MAX_TRIES);
  });

  it("becomes failed on the very first try for a non-retryable code", () => {
    const result = afterFailure(item({ tries: 0 }), 1_000, "FORBIDDEN");
    expect(result.status).toBe("failed");
    expect(result.tries).toBe(1);
  });
});

describe("pickNext", () => {
  it("returns the oldest ready item, so a photo goes before the lot that uses it", () => {
    const photo = item({ id: "photo", kind: "upload_blob", createdAt: 1 });
    const lot = item({ id: "lot", kind: "create_lot", createdAt: 2 });
    expect(pickNext([lot, photo], 100)?.id).toBe("photo");
  });

  it("skips an item whose nextTryAt is still in the future", () => {
    const notYet = item({ id: "not-yet", createdAt: 1, nextTryAt: 200 });
    const ready = item({ id: "ready", createdAt: 2, nextTryAt: 50 });
    expect(pickNext([notYet, ready], 100)?.id).toBe("ready");
  });

  it("never returns a failed item", () => {
    const failed = item({ id: "failed", status: "failed", createdAt: 1 });
    expect(pickNext([failed], 100)).toBeNull();
  });

  it("returns null for an empty queue", () => {
    expect(pickNext([], 100)).toBeNull();
  });
});

describe("summarizeOutbox", () => {
  it("is all zeros for an empty queue", () => {
    expect(summarizeOutbox([])).toEqual({ unresolved: 0, failed: 0, oldestPendingAt: null });
  });

  it("counts sending as unresolved, alongside pending", () => {
    const snapshot = summarizeOutbox([
      item({ id: "a", status: "pending", createdAt: 5 }),
      item({ id: "b", status: "sending", createdAt: 2 }),
    ]);
    expect(snapshot.unresolved).toBe(2);
    expect(snapshot.oldestPendingAt).toBe(2);
  });

  it("counts failed separately, excluded from unresolved and from oldestPendingAt", () => {
    const snapshot = summarizeOutbox([
      item({ id: "a", status: "pending", createdAt: 10 }),
      item({ id: "b", status: "failed", createdAt: 1 }), // older, but must not win oldestPendingAt
    ]);
    expect(snapshot).toEqual({ unresolved: 1, failed: 1, oldestPendingAt: 10 });
  });
});

describe("assertAllowedKind", () => {
  it("accepts every allowed kind", () => {
    for (const kind of [
      "upload_blob",
      "create_lot",
      "request_grade",
      "create_crates",
      "rate_deal",
      "create_ticket",
    ]) {
      expect(() => assertAllowedKind(kind)).not.toThrow();
    }
  });

  it("rejects money and trading kinds", () => {
    for (const kind of ["escrow_pay", "accept_bid", "place_bid"]) {
      expect(() => assertAllowedKind(kind)).toThrow("OUTBOX_KIND_NOT_ALLOWED");
    }
  });
});
