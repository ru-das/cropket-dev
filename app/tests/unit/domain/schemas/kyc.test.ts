// SPEC.md §5.4 `kyc-verify` input shapes. CLAUDE.md §6 "Zod schemas: good
// input passes, bad input fails."
import { describe, expect, it } from "vitest";
import { KycRequest, GSTIN_RE, PAN_RE, panFromGstin } from "@shared/schemas/kyc.ts";

describe("KycRequest", () => {
  it("accepts a valid business name, GSTIN and PAN", () => {
    const result = KycRequest.safeParse({
      businessName: "Sharma Traders",
      gstNumber: "27ABCDE1234F1Z5",
      pan: "ABCDE1234F",
    });
    expect(result.success).toBe(true);
  });

  it("trims and uppercases the GSTIN and PAN", () => {
    const result = KycRequest.parse({
      businessName: "Sharma Traders",
      gstNumber: " 27abcde1234f1z5 ",
      pan: " abcde1234f ",
    });
    expect(result.gstNumber).toBe("27ABCDE1234F1Z5");
    expect(result.pan).toBe("ABCDE1234F");
  });

  it("rejects a business name shorter than 3 characters", () => {
    expect(
      KycRequest.safeParse({ businessName: "AB", gstNumber: "27ABCDE1234F1Z5", pan: "ABCDE1234F" }).success,
    ).toBe(false);
  });

  it("rejects a malformed GSTIN", () => {
    expect(
      KycRequest.safeParse({ businessName: "Sharma Traders", gstNumber: "NOT-A-GSTIN", pan: "ABCDE1234F" }).success,
    ).toBe(false);
  });

  it("rejects a malformed PAN", () => {
    expect(
      KycRequest.safeParse({ businessName: "Sharma Traders", gstNumber: "27ABCDE1234F1Z5", pan: "12345ABCDE" })
        .success,
    ).toBe(false);
  });
});

describe("GSTIN_RE / PAN_RE", () => {
  it("a real-shaped GSTIN matches", () => {
    expect(GSTIN_RE.test("27ABCDE1234F1Z5")).toBe(true);
  });

  it("a real-shaped PAN matches", () => {
    expect(PAN_RE.test("ABCDE1234F")).toBe(true);
  });
});

describe("panFromGstin", () => {
  it("extracts characters 3-12 - the PAN embedded in a GSTIN", () => {
    expect(panFromGstin("27ABCDE1234F1Z5")).toBe("ABCDE1234F");
  });
});
