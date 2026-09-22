// SPEC.md §5.3/§5.6 place_bid input. CLAUDE.md §6 "Zod schemas: good input
// passes, bad input fails."
import { describe, expect, it } from "vitest";
import { BidInput } from "@shared/schemas/bid.ts";

describe("BidInput", () => {
  const base = {
    targetType: "lot" as const,
    targetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    pricePerQuintalPaise: 185_000,
  };

  it("accepts a real place-bid input", () => {
    expect(BidInput.safeParse(base).success).toBe(true);
  });

  it("rejects a non-uuid target", () => {
    expect(BidInput.safeParse({ ...base, targetId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a zero price", () => {
    expect(BidInput.safeParse({ ...base, pricePerQuintalPaise: 0 }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(BidInput.safeParse({ ...base, pricePerQuintalPaise: -100 }).success).toBe(false);
  });

  it("rejects a fractional price", () => {
    expect(BidInput.safeParse({ ...base, pricePerQuintalPaise: 100.5 }).success).toBe(false);
  });

  it("rejects a price over the sanity cap", () => {
    expect(BidInput.safeParse({ ...base, pricePerQuintalPaise: 10_000_001 }).success).toBe(
      false,
    );
  });

  it("rejects mega_lot until 3.4 adds it", () => {
    expect(BidInput.safeParse({ ...base, targetType: "mega_lot" }).success).toBe(false);
  });
});
