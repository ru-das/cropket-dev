// SPEC.md §4.13/§5.3 accept_bid input. CLAUDE.md §6 "Zod schemas: good input
// passes, bad input fails."
import { describe, expect, it } from "vitest";
import { AcceptBidInput } from "@shared/schemas/deal.ts";

describe("AcceptBidInput", () => {
  const base = {
    bidId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    consentAudioPath: "user-123/bid-abc.webm",
  };

  it("accepts a real accept-bid input", () => {
    expect(AcceptBidInput.safeParse(base).success).toBe(true);
  });

  it("rejects a non-uuid bid id", () => {
    expect(AcceptBidInput.safeParse({ ...base, bidId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an empty consent audio path", () => {
    expect(AcceptBidInput.safeParse({ ...base, consentAudioPath: "" }).success).toBe(false);
  });
});
