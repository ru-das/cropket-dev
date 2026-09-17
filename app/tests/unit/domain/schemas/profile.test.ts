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
  const base = { name: "Ramesh", village: "Niphad" };

  it("accepts a trimmed name and village, with a signup role and a crop", () => {
    const result = ProfileInput.safeParse({
      ...base,
      name: "  Ramesh  ",
      village: "  Niphad  ",
      role: "farmer",
      crops: ["onion"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ramesh");
      expect(result.data.village).toBe("Niphad");
    }
  });

  it("rejects a blank name", () => {
    expect(
      ProfileInput.safeParse({ ...base, name: "   ", role: "farmer", crops: ["onion"] }).success,
    ).toBe(false);
  });

  it("turns a blank village into null - it's a display label, a saved GPS point is enough", () => {
    const result = ProfileInput.safeParse({
      ...base,
      village: "  ",
      role: "farmer",
      crops: ["onion"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.village).toBeNull();
  });

  it("turns a missing village into null", () => {
    const result = ProfileInput.safeParse({
      name: "Ramesh",
      role: "farmer",
      crops: ["onion"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.village).toBeNull();
  });

  it("rejects an unknown crop", () => {
    expect(ProfileInput.safeParse({ ...base, role: "farmer", crops: ["wheat"] }).success).toBe(
      false,
    );
  });

  it("requires a farmer to pick at least one crop", () => {
    expect(ProfileInput.safeParse({ ...base, role: "farmer", crops: [] }).success).toBe(false);
  });

  it("requires an FPO to pick at least one crop", () => {
    expect(ProfileInput.safeParse({ ...base, role: "fpo", crops: [] }).success).toBe(false);
  });

  it("does not require a buyer to pick a crop", () => {
    expect(ProfileInput.safeParse({ ...base, role: "buyer" }).success).toBe(true);
  });

  it("defaults crops to empty when omitted", () => {
    const result = ProfileInput.safeParse({ ...base, role: "buyer" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.crops).toEqual([]);
  });

  it("defaults location to null when omitted", () => {
    const result = ProfileInput.safeParse({ ...base, role: "buyer" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.location).toBeNull();
  });

  it("accepts a real GPS point", () => {
    const result = ProfileInput.safeParse({
      ...base,
      role: "farmer",
      crops: ["onion"],
      location: { lat: 20.0, lng: 73.79 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a latitude out of range", () => {
    expect(
      ProfileInput.safeParse({
        ...base,
        role: "farmer",
        crops: ["onion"],
        location: { lat: 200, lng: 73.79 },
      }).success,
    ).toBe(false);
  });
});
