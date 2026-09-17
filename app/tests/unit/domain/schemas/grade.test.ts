// SPEC.md §5.4/§5.6 grade shapes. CLAUDE.md §6 "Zod schemas: good input
// passes, bad input fails."
import { describe, expect, it } from "vitest";
import { AiGradeResult, GradeRequest, needsHumanCheck } from "@shared/schemas/grade.ts";

describe("needsHumanCheck", () => {
  it("flags below 70% confidence", () => {
    expect(needsHumanCheck(69)).toBe(true);
  });

  it("does not flag exactly 70%", () => {
    expect(needsHumanCheck(70)).toBe(false);
  });

  it("does not flag above 70%", () => {
    expect(needsHumanCheck(71)).toBe(false);
  });
});

describe("GradeRequest", () => {
  const base = {
    gradeResultId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    crop: "onion",
    photoPaths: ["u1/p1.jpg", "u1/p2.jpg", "u1/p3.jpg"],
  };

  it("accepts a real request", () => {
    expect(GradeRequest.safeParse(base).success).toBe(true);
  });

  it("rejects a non-uuid gradeResultId", () => {
    expect(GradeRequest.safeParse({ ...base, gradeResultId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an unknown crop", () => {
    expect(GradeRequest.safeParse({ ...base, crop: "wheat" }).success).toBe(false);
  });

  it("rejects more than 3 photos", () => {
    expect(
      GradeRequest.safeParse({ ...base, photoPaths: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"] })
        .success,
    ).toBe(false);
  });

  it("rejects zero photos", () => {
    expect(GradeRequest.safeParse({ ...base, photoPaths: [] }).success).toBe(false);
  });
});

describe("AiGradeResult", () => {
  const base = {
    grade: "B",
    confidence: 82,
    size: { label: "medium", mmAvg: 42 },
    colour: { label: "good", healthyPct: 90 },
    damagePct: 5,
    source: "mock",
  };

  it("accepts a real result", () => {
    expect(AiGradeResult.safeParse(base).success).toBe(true);
  });

  it("accepts a null mmAvg (no coin found)", () => {
    expect(AiGradeResult.safeParse({ ...base, size: { ...base.size, mmAvg: null } }).success).toBe(
      true,
    );
  });

  it("rejects an unknown grade letter", () => {
    expect(AiGradeResult.safeParse({ ...base, grade: "D" }).success).toBe(false);
  });

  it("rejects confidence above 100", () => {
    expect(AiGradeResult.safeParse({ ...base, confidence: 101 }).success).toBe(false);
  });

  it("rejects an unknown source", () => {
    expect(AiGradeResult.safeParse({ ...base, source: "real" }).success).toBe(false);
  });
});
