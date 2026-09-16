// One real check for the repo skeleton: cn() must merge Tailwind classes
// and let a later conflicting class win (this is what shadcn/ui relies on).
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("lets a later conflicting class win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
