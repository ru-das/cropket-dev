// buildGradeRequest (SPEC.md §5.4) - the pure part of services/grading.ts's
// requestGrade(). Same pattern as photos.test.ts's cropPhotoPath: test the
// pure half, leave the Dexie/network glue thin and untested directly.
import { describe, expect, it } from "vitest";
import { buildGradeRequest } from "@/services/grading";

const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UPLOADED = [
  { uploadedPath: "u1/p1.jpg" },
  { uploadedPath: "u1/p2.jpg" },
  { uploadedPath: "u1/p3.jpg" },
];

describe("buildGradeRequest", () => {
  it("builds a valid GradeRequest from a crop and its uploaded blobs", () => {
    const result = buildGradeRequest(ID, "onion", UPLOADED);
    expect(result).toEqual({
      gradeResultId: ID,
      crop: "onion",
      photoPaths: ["u1/p1.jpg", "u1/p2.jpg", "u1/p3.jpg"],
    });
  });

  it("throws when a blob has not finished uploading yet (outbox retries later)", () => {
    expect(() =>
      buildGradeRequest(ID, "onion", [{ uploadedPath: "u1/p1.jpg" }, {}]),
    ).toThrow();
  });

  it("throws for an unknown crop", () => {
    expect(() => buildGradeRequest(ID, "wheat", UPLOADED)).toThrow();
  });
});
