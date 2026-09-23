// SPEC.md §5.2 cron-auto-settle + escrow-skip-timer input/output shapes.
// CLAUDE.md §6 "Zod schemas: good input passes, bad input fails."
import { describe, expect, it } from "vitest";
import { AutoSettleResult, SkipTimerInput, SkipTimerResult } from "@shared/schemas/escrow.ts";

describe("AutoSettleResult", () => {
  it("accepts a real result", () => {
    expect(AutoSettleResult.safeParse({ released: 3, failed: 0 }).success).toBe(true);
  });

  it("rejects a negative count", () => {
    expect(AutoSettleResult.safeParse({ released: -1, failed: 0 }).success).toBe(false);
  });

  it("rejects a non-integer count", () => {
    expect(AutoSettleResult.safeParse({ released: 1.5, failed: 0 }).success).toBe(false);
  });
});

describe("SkipTimerInput", () => {
  it("accepts a real escrow id", () => {
    expect(SkipTimerInput.safeParse({ escrowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }).success).toBe(true);
  });

  it("rejects a non-uuid escrow id", () => {
    expect(SkipTimerInput.safeParse({ escrowId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("SkipTimerResult", () => {
  it("accepts a real result", () => {
    expect(
      SkipTimerResult.safeParse({ state: "RELEASED", autoReleaseAt: "2026-09-23T12:00:00+00:00" }).success,
    ).toBe(true);
  });

  it("rejects a non-datetime autoReleaseAt", () => {
    expect(SkipTimerResult.safeParse({ state: "RELEASED", autoReleaseAt: "not-a-date" }).success).toBe(false);
  });
});
