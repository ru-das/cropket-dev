// Pure display helpers for the grade result screen (SPEC.md §4.6). See
// components/lot/gradeDisplay.ts's own doc comments for why each thing
// exists - this only proves the boundaries.
import { describe, expect, it } from "vitest";
import {
  colourLabelFor,
  gradeView,
  isDoneGrade,
  normalizeSizeLabel,
  sizeFraction,
  type GradeResult,
} from "@/components/lot/gradeDisplay";

function fakeRow(overrides: Partial<GradeResult> = {}): GradeResult {
  return {
    id: "row-1",
    farmer_id: "farmer-1",
    crop: "onion",
    status: "pending",
    grade: null,
    confidence: null,
    size_label: null,
    colour_pct: null,
    damage_pct: null,
    photo_paths: ["farmer-1/a.jpg"],
    kind: "indicative",
    needs_human_check: false,
    source: null,
    client_created_at: null,
    created_at: "2026-09-17T00:00:00Z",
    ...overrides,
  };
}

describe("isDoneGrade / gradeView", () => {
  it("is 'loading' while the query has no answer yet", () => {
    expect(gradeView(undefined, true, true)).toBe("loading");
  });

  it("is 'waiting' when there's no row yet and the phone is online", () => {
    expect(gradeView(null, false, true)).toBe("waiting");
  });

  it("is 'waitingOffline' when there's no row yet and the phone is offline", () => {
    expect(gradeView(null, false, false)).toBe("waitingOffline");
  });

  it("is 'waiting' while status is still pending", () => {
    expect(gradeView(fakeRow({ status: "pending" }), false, true)).toBe("waiting");
  });

  it("is 'failed' when status is failed", () => {
    expect(gradeView(fakeRow({ status: "failed" }), false, true)).toBe("failed");
  });

  it("is 'done' once every field the screen needs is filled in", () => {
    const row = fakeRow({
      status: "done",
      grade: "B",
      confidence: 82,
      size_label: "medium",
      colour_pct: 90,
      damage_pct: 5,
      source: "mock",
    });
    expect(gradeView(row, false, true)).toBe("done");
    expect(isDoneGrade(row)).toBe(true);
  });

  it("is 'failed', not 'done', if status says done but a field is still missing", () => {
    // Shouldn't happen (the grade function writes these together) - fail
    // honest rather than render with a fabricated value.
    const row = fakeRow({ status: "done", grade: "B", confidence: null });
    expect(gradeView(row, false, true)).toBe("failed");
    expect(isDoneGrade(row)).toBe(false);
  });
});

describe("sizeFraction / normalizeSizeLabel", () => {
  it("maps known labels to their bar fill", () => {
    expect(sizeFraction("small")).toBe(0.35);
    expect(sizeFraction("medium")).toBe(0.8);
    expect(sizeFraction("large")).toBe(1);
  });

  it("falls back to an empty bar for an unrecognised label", () => {
    expect(sizeFraction("gigantic")).toBe(0);
    expect(normalizeSizeLabel("gigantic")).toBe("unknown");
  });
});

describe("colourLabelFor", () => {
  it("is 'poor' below 65", () => {
    expect(colourLabelFor(64)).toBe("poor");
  });

  it("is 'fair' from 65 up to (not including) 85", () => {
    expect(colourLabelFor(65)).toBe("fair");
    expect(colourLabelFor(84)).toBe("fair");
  });

  it("is 'good' from 85 up", () => {
    expect(colourLabelFor(85)).toBe("good");
    expect(colourLabelFor(90)).toBe("good");
  });
});
