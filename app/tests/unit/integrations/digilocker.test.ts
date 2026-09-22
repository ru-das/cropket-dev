// CLAUDE.md §6 "Mock adapters: mock output passes the same zod schema as
// real (test the pure mock.ts files)". Verify rule decided with the user:
// a real GSTIN's chars 3-12 are the holder's PAN, so a matching PAN
// verifies instantly and a mismatched one goes to the admin queue.
import { describe, expect, it } from "vitest";
import { KycResult } from "@shared/schemas/kyc.ts";
import { checkKyc as mockCheckKyc } from "../../../../supabase/functions/_shared/integrations/digilocker/mock.ts";

const BASE = { businessName: "Sharma Traders", gstNumber: "27ABCDE1234F1Z5" };

describe("integrations/digilocker mock", () => {
  it("verifies when the PAN matches the GSTIN's embedded PAN", async () => {
    const result = await mockCheckKyc({ ...BASE, pan: "ABCDE1234F" });
    expect(result.status).toBe("verified");
  });

  it("leaves it pending when the PAN does not match", async () => {
    const result = await mockCheckKyc({ ...BASE, pan: "ZZZZZ9999Z" });
    expect(result.status).toBe("pending");
  });

  it("returns a result that passes KycResult, the same schema real.ts must pass", async () => {
    const result = await mockCheckKyc({ ...BASE, pan: "ABCDE1234F" });
    expect(KycResult.safeParse(result).success).toBe(true);
  });

  it("always marks itself as a mock", async () => {
    const result = await mockCheckKyc({ ...BASE, pan: "ZZZZZ9999Z" });
    expect(result.source).toBe("mock");
  });
});
