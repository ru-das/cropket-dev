// SPEC.md §4.16/§5.4 shipments-create + trip input shapes. CLAUDE.md §6
// "Zod schemas: good input passes, bad input fails."
import { describe, expect, it } from "vitest";
import { ShipmentCreateInput, OtpSubmitInput } from "@shared/schemas/shipment.ts";

describe("ShipmentCreateInput", () => {
  const base = {
    dealId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    driverPhone: "9876543210",
    vehicleNumber: "MH15AB1234",
  };

  it("accepts a real shipment input", () => {
    expect(ShipmentCreateInput.safeParse(base).success).toBe(true);
  });

  it("normalises a lowercase, spaced-out vehicle number", () => {
    const parsed = ShipmentCreateInput.parse({ ...base, vehicleNumber: "mh15 ab 1234" });
    expect(parsed.vehicleNumber).toBe("MH15AB1234");
  });

  it("normalises a hyphenated vehicle number", () => {
    const parsed = ShipmentCreateInput.parse({ ...base, vehicleNumber: "MH-15-AB-1234" });
    expect(parsed.vehicleNumber).toBe("MH15AB1234");
  });

  it("rejects a vehicle number that isn't a plate shape", () => {
    expect(ShipmentCreateInput.safeParse({ ...base, vehicleNumber: "not a plate" }).success).toBe(false);
  });

  it("rejects a phone that doesn't start with 6-9", () => {
    expect(ShipmentCreateInput.safeParse({ ...base, driverPhone: "5876543210" }).success).toBe(false);
  });

  it("rejects a phone with the wrong length", () => {
    expect(ShipmentCreateInput.safeParse({ ...base, driverPhone: "98765432" }).success).toBe(false);
  });

  it("rejects a non-uuid deal id", () => {
    expect(ShipmentCreateInput.safeParse({ ...base, dealId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("OtpSubmitInput", () => {
  it("accepts a 4-digit code", () => {
    expect(OtpSubmitInput.safeParse({ otp: "4817" }).success).toBe(true);
  });

  it("rejects a code with letters", () => {
    expect(OtpSubmitInput.safeParse({ otp: "48a7" }).success).toBe(false);
  });

  it("rejects a code with the wrong length", () => {
    expect(OtpSubmitInput.safeParse({ otp: "481" }).success).toBe(false);
  });
});
