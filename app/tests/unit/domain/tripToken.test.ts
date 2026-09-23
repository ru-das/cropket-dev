// CLAUDE.md §6 "Formulas ..., edge cases" - tripToken.ts is pure (no Deno/
// env import, only Web Crypto), so Vitest calls it directly, same as
// deliveryOtp.test.ts.
import { describe, expect, it } from "vitest";
import { newTripToken, hashTripToken } from "../../../../supabase/functions/_shared/domain/tripToken.ts";

describe("domain/tripToken", () => {
  it("newTripToken makes a 43-char base64url string (32 random bytes, no padding)", () => {
    const token = newTripToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("newTripToken never repeats itself", () => {
    const a = newTripToken();
    const b = newTripToken();
    expect(a).not.toBe(b);
  });

  it("hashTripToken matches a known sha256 vector (the standard 'abc' test string)", async () => {
    const hash = await hashTripToken("abc");
    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("hashTripToken is always 64 lowercase hex chars", async () => {
    const hash = await hashTripToken(newTripToken());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashTripToken is deterministic for the same token", async () => {
    const token = newTripToken();
    expect(await hashTripToken(token)).toBe(await hashTripToken(token));
  });
});
