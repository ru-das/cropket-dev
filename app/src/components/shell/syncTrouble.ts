// Pure logic behind SyncTrouble.tsx (SPEC.md §5.8 rule 4, CLAUDE.md §5
// "warn when items wait more than 24 h"). Kept separate from the component
// so the two warning states are unit-testable with no DOM, same pattern as
// components/lot/gradeDisplay.ts.
import type { OutboxSnapshot } from "@/offline/outbox";

const WAITING_TOO_LONG_MS = 24 * 60 * 60 * 1000;

export type SyncTroubleView = { kind: "none" } | { kind: "failed" } | { kind: "waiting" };

/**
 * `failed` wins over `waiting` - a give-up that needs a tap is more urgent
 * than a warning that it's just taking a while. `now` defaults to the real
 * clock (same pattern as lib/dataAge.ts's `isStale`) so the component can
 * call this with no argument instead of reading `Date.now()` itself, which
 * the react-hooks/purity lint rule rejects inside a render body.
 */
export function syncTroubleView(snapshot: OutboxSnapshot, now: number = Date.now()): SyncTroubleView {
  if (snapshot.failed > 0) return { kind: "failed" };
  if (snapshot.oldestPendingAt !== null && now - snapshot.oldestPendingAt >= WAITING_TOO_LONG_MS) {
    return { kind: "waiting" };
  }
  return { kind: "none" };
}
