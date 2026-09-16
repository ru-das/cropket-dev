// SPEC.md §3.1: each role has its own home route.
import { describe, expect, it } from "vitest";
import { homeFor } from "@/lib/roles";

describe("homeFor", () => {
  it("sends farmer, buyer and fpo to their own home", () => {
    expect(homeFor("farmer")).toBe("/farmer");
    expect(homeFor("buyer")).toBe("/buyer");
    expect(homeFor("fpo")).toBe("/fpo");
  });

  it("sends both admin and nbfc to /admin", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("nbfc")).toBe("/admin");
  });
});
