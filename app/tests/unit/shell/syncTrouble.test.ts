// SPEC.md §5.8 rule 4 ("Try again" on a failed item) + CLAUDE.md §5 ("warn
// when items wait more than 24 h"). Pure - no DOM, no Dexie.
import { describe, expect, it } from "vitest";
import { syncTroubleView } from "@/components/shell/syncTrouble";
import type { OutboxSnapshot } from "@/offline/outbox";

const NOW = 1_000_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

function snapshot(overrides: Partial<OutboxSnapshot> = {}): OutboxSnapshot {
  return { unresolved: 0, failed: 0, oldestPendingAt: null, ...overrides };
}

describe("syncTroubleView", () => {
  it("shows nothing for a clean, empty queue", () => {
    expect(syncTroubleView(snapshot(), NOW)).toEqual({ kind: "none" });
  });

  it("shows nothing while a pending item is still young", () => {
    const s = snapshot({ unresolved: 1, oldestPendingAt: NOW - DAY_MS + 60_000 });
    expect(syncTroubleView(s, NOW)).toEqual({ kind: "none" });
  });

  it("warns once the oldest pending item has waited 24 h", () => {
    const s = snapshot({ unresolved: 1, oldestPendingAt: NOW - DAY_MS });
    expect(syncTroubleView(s, NOW)).toEqual({ kind: "waiting" });
  });

  it("flags any failed item, regardless of age", () => {
    const s = snapshot({ failed: 1 });
    expect(syncTroubleView(s, NOW)).toEqual({ kind: "failed" });
  });

  it("prefers failed over waiting when both are true", () => {
    const s = snapshot({ failed: 1, unresolved: 1, oldestPendingAt: NOW - DAY_MS });
    expect(syncTroubleView(s, NOW)).toEqual({ kind: "failed" });
  });
});
