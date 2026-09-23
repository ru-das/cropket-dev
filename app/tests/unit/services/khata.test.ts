// Pure helper behind services/khata.ts (SPEC.md §4.15, §9.2 Phase 4 "4.4
// Khata screen") - same pattern as prices.test.ts: test the pure summary
// math, leave the Supabase round trip in getMyKhata() thin and untested
// directly.
import { describe, expect, it } from "vitest";
import { summariseKhata, type KhataEntry } from "@/services/khata";

function entry(overrides: Partial<KhataEntry> & { dealId: string }): KhataEntry {
  return {
    id: overrides.dealId,
    amountPaise: 100000,
    colour: "yellow",
    titleKey: "khata.moneyLocked",
    crop: "onion",
    quantityKg: 500,
    createdAt: "2026-09-10T06:00:00.000Z",
    ...overrides,
  };
}

describe("summariseKhata", () => {
  it("returns zeros for an empty ledger", () => {
    const result = summariseKhata([]);
    expect(result).toEqual({ rows: [], receivedThisMonthPaise: 0, lockedPaise: 0, inTransitCount: 0 });
  });

  it("collapses a deal's 🟡 then 🔵 rows into one row showing the latest colour", () => {
    const entries = [
      entry({ id: "e1", dealId: "d1", colour: "yellow", amountPaise: 96000, createdAt: "2026-09-10T06:00:00.000Z" }),
      entry({ id: "e2", dealId: "d1", colour: "blue", amountPaise: 96000, createdAt: "2026-09-12T06:00:00.000Z" }),
    ];
    const result = summariseKhata(entries);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe("e2");
    expect(result.rows[0].colour).toBe("blue");
    // Locked only counts a deal still on its latest 🟡 row - one that has
    // moved on to 🔵 must not still be counted as locked.
    expect(result.lockedPaise).toBe(0);
    expect(result.inTransitCount).toBe(1);
  });

  it("sums Locked from only the latest-🟡 rows, one per deal", () => {
    const entries = [
      entry({ id: "e1", dealId: "d1", colour: "yellow", amountPaise: 96000 }),
      entry({ id: "e2", dealId: "d2", colour: "yellow", amountPaise: 40000 }),
      entry({ id: "e3", dealId: "d3", colour: "blue", amountPaise: 12000 }),
    ];
    const result = summariseKhata(entries);
    expect(result.lockedPaise).toBe(136000);
    expect(result.inTransitCount).toBe(1);
  });

  it("counts Received only for 🟢 rows in the current month, in Asia/Kolkata", () => {
    const now = new Date("2026-09-15T10:00:00.000Z");
    const entries = [
      // 19:00 UTC on 31 Aug is already 00:30 IST on 1 Sep - the same
      // September the `now` above falls in, so this must count.
      entry({ id: "e1", dealId: "d1", colour: "green", amountPaise: 620000, createdAt: "2026-08-31T19:00:00.000Z" }),
      // Comfortably inside August IST - must not count.
      entry({ id: "e2", dealId: "d2", colour: "green", amountPaise: 120000, createdAt: "2026-08-20T06:00:00.000Z" }),
      // A 🟡 row this month must not count as Received.
      entry({ id: "e3", dealId: "d3", colour: "yellow", amountPaise: 50000, createdAt: "2026-09-05T06:00:00.000Z" }),
    ];
    const result = summariseKhata(entries, now);
    expect(result.receivedThisMonthPaise).toBe(620000);
  });
});
