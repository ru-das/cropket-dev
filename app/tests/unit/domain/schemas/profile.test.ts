// SPEC.md §5.6 phone/role shapes. CLAUDE.md §6 "Zod schemas: good input
// passes, bad input fails."
import { describe, expect, it } from "vitest";
import { Phone10, SignupRole, ProfileInput } from "@shared/schemas/profile.ts";

describe("Phone10", () => {
  it("accepts a real 10-digit mobile number", () => {
    expect(Phone10.safeParse("9876543210").success).toBe(true);
  });

  it("rejects a number starting with a digit below 6", () => {
    expect(Phone10.safeParse("1234567890").success).toBe(false);
  });

  it("rejects a number shorter than 10 digits", () => {
    expect(Phone10.safeParse("98765").success).toBe(false);
  });

  it("rejects a number with a +91 prefix already on it", () => {
    expect(Phone10.safeParse("+919876543210").success).toBe(false);
  });
});

describe("SignupRole", () => {
  it("accepts farmer, buyer and fpo", () => {
    expect(SignupRole.safeParse("farmer").success).toBe(true);
    expect(SignupRole.safeParse("buyer").success).toBe(true);
    expect(SignupRole.safeParse("fpo").success).toBe(true);
  });

  it("rejects admin and nbfc - those are made by hand, not picked at onboarding", () => {
    expect(SignupRole.safeParse("admin").success).toBe(false);
    expect(SignupRole.safeParse("nbfc").success).toBe(false);
  });
});

describe("ProfileInput", () => {
  it("accepts a trimmed name and a signup role", () => {
    const result = ProfileInput.safeParse({ name: "  Ramesh  ", role: "farmer" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ramesh");
  });

  it("rejects a blank name", () => {
    expect(ProfileInput.safeParse({ name: "   ", role: "farmer" }).success).toBe(false);
  });
});
