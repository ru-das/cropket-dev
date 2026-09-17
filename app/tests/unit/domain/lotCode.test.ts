// SPEC.md §4.7 "L-2041" short code. CLAUDE.md §6 "edge cases (zero, missing
// data)" - the boundary this file exists to catch is padding: a small
// number must still print as 6 digits, not "L-7".
import { describe, expect, it } from "vitest";
import { lotCode } from "@shared/lotCode.ts";

describe("lotCode", () => {
  it("is deterministic - the same id always gives the same code", () => {
    const id = "aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa";
    expect(lotCode(id)).toBe(lotCode(id));
  });

  it("starts with L- and has exactly 6 digits after it", () => {
    const code = lotCode("aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa");
    expect(code).toMatch(/^L-\d{6}$/);
  });

  it("zero-pads a small number", () => {
    // "00000007" as hex -> 7 -> "L-000007", not "L-7".
    expect(lotCode("00000007-1111-4aaa-8aaa-aaaaaaaaaaaa")).toBe("L-000007");
  });

  it("different ids usually give different codes", () => {
    expect(lotCode("11111111-1111-4aaa-8aaa-aaaaaaaaaaaa")).not.toBe(
      lotCode("22222222-1111-4aaa-8aaa-aaaaaaaaaaaa"),
    );
  });
});
