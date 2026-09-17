// SPEC.md §2.3 Reference Floor Price - advisory, never blocks (CLAUDE.md §6
// "the floor price warns, never blocks"). Edge cases: zero/missing data.
import { describe, expect, it } from "vitest";
import { isBelowFloor, referenceFloorPaise } from "@shared/floor.ts";

describe("referenceFloorPaise", () => {
  it("p20_modal_30d is the exact 20th-percentile (nearest-rank) of 30 known values", () => {
    // 30 values 1..30 (in paise-per-quintal units for this test). 20th
    // percentile, nearest-rank: idx = ceil(0.2 * 30) - 1 = 5 -> sorted[5] = 6.
    const modalPricesPaise = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(referenceFloorPaise({ method: "p20_modal_30d", modalPricesPaise })).toBe(6);
  });

  it("p20_modal_30d works unsorted", () => {
    const modalPricesPaise = [30, 10, 20, 5, 15];
    // sorted: 5,10,15,20,30 -> idx = ceil(0.2*5)-1 = 0 -> 5
    expect(referenceFloorPaise({ method: "p20_modal_30d", modalPricesPaise })).toBe(5);
  });

  it("returns null when there is no price history", () => {
    expect(referenceFloorPaise({ method: "p20_modal_30d", modalPricesPaise: [] })).toBeNull();
  });

  it("msp method returns the MSP when set", () => {
    expect(
      referenceFloorPaise({ method: "msp", mspPerQuintalPaise: 250000, modalPricesPaise: [] }),
    ).toBe(250000);
  });

  it("msp method returns null when no MSP is set yet", () => {
    expect(
      referenceFloorPaise({ method: "msp", mspPerQuintalPaise: null, modalPricesPaise: [] }),
    ).toBeNull();
  });
});

describe("isBelowFloor", () => {
  it("a price below the floor warns", () => {
    expect(isBelowFloor(9000, 10000)).toBe(true);
  });

  it("a price exactly at the floor does not warn", () => {
    expect(isBelowFloor(10000, 10000)).toBe(false);
  });

  it("a price above the floor does not warn", () => {
    expect(isBelowFloor(11000, 10000)).toBe(false);
  });

  it("an unknown floor never warns", () => {
    expect(isBelowFloor(0, null)).toBe(false);
  });
});
