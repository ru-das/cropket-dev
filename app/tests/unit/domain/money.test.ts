// SPEC.md §2.4 formulas, edge cases (zero, missing data) - CLAUDE.md §6.
import { describe, expect, it } from "vitest";
import { formatRupees, grossPaise, pctOfPaise, toPaise, toRupees } from "@shared/money.ts";

describe("money", () => {
  it("toPaise rounds to the nearest paisa", () => {
    expect(toPaise(1850)).toBe(185000);
    expect(toPaise(10.005)).toBe(1001); // 1000.5 -> rounds up
  });

  it("toRupees is the inverse of toPaise for whole rupees", () => {
    expect(toRupees(185000)).toBe(1850);
  });

  it("formatRupees uses Indian digit grouping with no decimals", () => {
    expect(formatRupees(15000000)).toBe("₹1,50,000");
  });

  it("formatRupees handles zero", () => {
    expect(formatRupees(0)).toBe("₹0");
  });

  it("pctOfPaise rounds once", () => {
    expect(pctOfPaise(10000, 1.05)).toBe(105);
  });

  it("grossPaise matches the SPEC.md §4.9 Lasalgaon row: 500 kg at ₹1,850/quintal = ₹9,250", () => {
    expect(grossPaise(185000, 500)).toBe(925000);
  });

  it("grossPaise is zero for zero quantity", () => {
    expect(grossPaise(185000, 0)).toBe(0);
  });
});
