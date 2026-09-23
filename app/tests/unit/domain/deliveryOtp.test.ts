// CLAUDE.md §6 "Formulas in SPEC.md §2.4, edge cases" - deliveryOtp() is
// pure (no Deno/env import, only Web Crypto), so Vitest calls it directly,
// same as cashfreeSignature's test.
import { describe, expect, it } from "vitest";
import { deliveryOtp } from "../../../../supabase/functions/_shared/domain/deliveryOtp.ts";

describe("domain/deliveryOtp", () => {
  it("matches a known-answer vector (computed independently with openssl)", async () => {
    // printf '%s' 'escrow-id-1' | openssl dgst -sha256 -hmac 'test-pepper' -binary \
    //   | xxd -p | head -c 8   ->  d09f9564   ->   0xd09f9564 % 10000 == 9396
    const code = await deliveryOtp("test-pepper", "escrow-id-1");
    expect(code).toBe("9396");
  });

  it("is always exactly 4 digits, zero-padded", async () => {
    for (const id of ["a", "b", "c", "escrow-1", "escrow-2", "00000000-0000-0000-0000-000000000000"]) {
      const code = await deliveryOtp("some-pepper", id);
      expect(code).toMatch(/^\d{4}$/);
    }
  });

  it("is deterministic for the same pepper and escrow id", async () => {
    const a = await deliveryOtp("pepper", "escrow-x");
    const b = await deliveryOtp("pepper", "escrow-x");
    expect(a).toBe(b);
  });

  it("gives a different code for a different pepper", async () => {
    const a = await deliveryOtp("pepper-1", "escrow-x");
    const b = await deliveryOtp("pepper-2", "escrow-x");
    expect(a).not.toBe(b);
  });

  it("gives a different code for a different escrow id", async () => {
    const a = await deliveryOtp("pepper", "escrow-x");
    const b = await deliveryOtp("pepper", "escrow-y");
    expect(a).not.toBe(b);
  });
});
