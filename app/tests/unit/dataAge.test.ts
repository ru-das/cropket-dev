// CLAUDE.md §6 "Formulas ... edge cases" for the 6-hour staleness rule
// (SPEC.md §5.8, §4.22).
import { describe, expect, it } from "vitest";
import { formatAgo, isStale, STALE_AFTER_MS } from "@/lib/dataAge";

const now = new Date("2026-09-16T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

describe("isStale", () => {
  it("is not stale at 5 hours old", () => {
    expect(isStale(hoursAgo(5), now)).toBe(false);
  });

  it("is not stale at exactly 6 hours old (boundary is exclusive)", () => {
    expect(isStale(hoursAgo(6), now)).toBe(false);
  });

  it("is stale at 7 hours old", () => {
    expect(isStale(hoursAgo(7), now)).toBe(true);
  });

  it("accepts an ISO string the same way as a Date", () => {
    expect(isStale(hoursAgo(7).toISOString(), now)).toBe(true);
  });

  it("STALE_AFTER_MS matches 6 hours", () => {
    expect(STALE_AFTER_MS).toBe(6 * 60 * 60 * 1000);
  });
});

describe("formatAgo", () => {
  it("reads in minutes under 1h, in English (LiveBidBox's recent-bids list)", () => {
    expect(formatAgo(minutesAgo(2), "en", now)).toBe("2 minutes ago");
  });

  it("reads in hours under 48h, in English", () => {
    expect(formatAgo(hoursAgo(7), "en", now)).toBe("7 hours ago");
  });

  it("reads in days at 48h and above, in English", () => {
    expect(formatAgo(hoursAgo(48), "en", now)).toBe("2 days ago");
  });

  it("produces non-empty Devanagari output in Hindi", () => {
    const result = formatAgo(hoursAgo(7), "hi", now);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/[ऀ-ॿ]/);
  });

  it("produces non-empty Devanagari output in Marathi", () => {
    const result = formatAgo(hoursAgo(48), "mr", now);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/[ऀ-ॿ]/);
  });
});
