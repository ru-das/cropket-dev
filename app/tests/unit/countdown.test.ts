// formatCountdown() (SPEC.md §5.1 Countdown component, §9.2 Phase 4 "4.9").
// Pure so it's unit-testable on its own - the component is
// components/money/Countdown.tsx.
import { describe, expect, it } from "vitest";
import { formatCountdown } from "@/lib/countdown";

describe("formatCountdown", () => {
  it("formats hours, minutes and seconds as HH:MM:SS", () => {
    expect(formatCountdown(23 * 3600_000 + 14 * 60_000 + 5_000)).toBe("23:14:05");
  });

  it("pads single-digit minutes and seconds", () => {
    expect(formatCountdown(1 * 3600_000 + 2 * 60_000 + 3_000)).toBe("01:02:03");
  });

  it("shows 00:00:00 at exactly zero", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
  });

  it("never shows a negative time - clamps to zero", () => {
    expect(formatCountdown(-5_000)).toBe("00:00:00");
  });

  it("rounds down partial seconds", () => {
    expect(formatCountdown(1_999)).toBe("00:00:01");
  });
});
