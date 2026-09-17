// SPEC.md §5.6/§5.8 lot create input. CLAUDE.md §6 "Zod schemas: good input
// passes, bad input fails."
import { describe, expect, it } from "vitest";
import { LotInput, LotStatus } from "@shared/schemas/lot.ts";

describe("LotInput", () => {
  const base = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    crop: "onion",
    quantityKg: 500,
    gradeResultId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    grade: "B",
    location: { lat: 20.0, lng: 73.79 },
    clientCreatedAt: new Date().toISOString(),
  };

  it("accepts a real create-lot input", () => {
    expect(LotInput.safeParse(base).success).toBe(true);
  });

  it("accepts a null location - GPS can be denied or time out", () => {
    expect(LotInput.safeParse({ ...base, location: null }).success).toBe(true);
  });

  it("accepts a null gradeResultId and grade", () => {
    expect(
      LotInput.safeParse({ ...base, gradeResultId: null, grade: null }).success,
    ).toBe(true);
  });

  it("rejects zero kg", () => {
    expect(LotInput.safeParse({ ...base, quantityKg: 0 }).success).toBe(false);
  });

  it("rejects more than 100000 kg", () => {
    expect(LotInput.safeParse({ ...base, quantityKg: 100_001 }).success).toBe(false);
  });

  it("rejects a fractional kg value", () => {
    expect(LotInput.safeParse({ ...base, quantityKg: 12.5 }).success).toBe(false);
  });

  it("rejects an unknown crop", () => {
    expect(LotInput.safeParse({ ...base, crop: "wheat" }).success).toBe(false);
  });

  it("rejects a non-uuid id", () => {
    expect(LotInput.safeParse({ ...base, id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("LotStatus", () => {
  it("accepts every known status", () => {
    for (const status of [
      "draft",
      "listed",
      "in_mega",
      "sold",
      "in_transit",
      "delivered",
      "rescued",
      "salvage",
    ]) {
      expect(LotStatus.safeParse(status).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(LotStatus.safeParse("cancelled").success).toBe(false);
  });
});
