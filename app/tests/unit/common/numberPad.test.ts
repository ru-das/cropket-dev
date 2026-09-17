// NumberPad's key logic (SPEC.md §4.7, §5.1). CLAUDE.md §6 "edge cases
// (zero, missing data)" - the boundaries here are the digit cap and the
// "don't prefix a leading zero" rule.
import { describe, expect, it } from "vitest";
import { MAX_DIGITS, pressBackspace, pressDigit } from "@/components/common/numberPad";

describe("pressDigit", () => {
  it("appends digits in order", () => {
    let value = "1";
    value = pressDigit(value, "2");
    value = pressDigit(value, "3");
    expect(value).toBe("123");
  });

  it("replaces a lone 0 instead of prefixing it", () => {
    expect(pressDigit("0", "5")).toBe("5");
  });

  it("pressing 0 on a lone 0 stays 0, not 00", () => {
    expect(pressDigit("0", "0")).toBe("0");
  });

  it(`caps at ${MAX_DIGITS} digits`, () => {
    expect(pressDigit("123456", "7")).toBe("123456");
  });

  it("allows the 6th digit", () => {
    expect(pressDigit("12345", "6")).toBe("123456");
  });
});

describe("pressBackspace", () => {
  it("removes the last digit", () => {
    expect(pressBackspace("500")).toBe("50");
  });

  it("goes back to 0, not empty, from a single digit", () => {
    expect(pressBackspace("5")).toBe("0");
  });

  it("stays 0 when already 0", () => {
    expect(pressBackspace("0")).toBe("0");
  });
});
