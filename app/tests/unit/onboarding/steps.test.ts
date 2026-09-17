// SPEC.md §4.3 - farmer/FPO answer 4 questions, a buyer answers 3.
import { describe, expect, it } from "vitest";
import { stepsFor } from "@/routes/onboarding/steps";

describe("stepsFor", () => {
  it("gives farmer all four steps, ending with crops", () => {
    expect(stepsFor("farmer")).toEqual(["role", "name", "place", "crops"]);
  });

  it("gives fpo all four steps too", () => {
    expect(stepsFor("fpo")).toEqual(["role", "name", "place", "crops"]);
  });

  it("stops a buyer after place - no crop question", () => {
    expect(stepsFor("buyer")).toEqual(["role", "name", "place"]);
  });

  it("falls back to the farmer/FPO list before a role is picked", () => {
    expect(stepsFor(null)).toEqual(["role", "name", "place", "crops"]);
  });
});
