// isExpiredBlob (SPEC.md §5.8 rule 6: "uploaded blobs are deleted from the
// phone after 7 days"). Pure - no Dexie, matching outbox.test.ts's style.
import { describe, expect, it } from "vitest";
import { isExpiredBlob } from "@/offline/sync";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("isExpiredBlob", () => {
  it("is false for a blob not yet uploaded, no matter how old", () => {
    expect(isExpiredBlob(undefined, NOW - 30 * DAY_MS, NOW)).toBe(false);
  });

  it("is false for an uploaded blob younger than 7 days", () => {
    expect(isExpiredBlob("path.jpg", NOW - 6 * DAY_MS, NOW)).toBe(false);
  });

  it("is true for an uploaded blob exactly 7 days old", () => {
    expect(isExpiredBlob("path.jpg", NOW - 7 * DAY_MS, NOW)).toBe(true);
  });

  it("is true for an uploaded blob older than 7 days", () => {
    expect(isExpiredBlob("path.jpg", NOW - 8 * DAY_MS, NOW)).toBe(true);
  });
});
