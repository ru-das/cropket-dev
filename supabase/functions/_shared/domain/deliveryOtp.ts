// Derives the 4-digit delivery code shown to the buyer (SPEC.md §4.14, §5.6,
// §9.2 Phase 4 "4.5") instead of storing it. Pure Web Crypto
// (`crypto.subtle`), no Deno/env import - same reasoning
// `integrations/cashfree/signature.ts` gives, so Vitest can call this
// directly. The code is HMAC-SHA256(pepper, escrowId), read as the first 4
// bytes of the digest treated as a big-endian uint32, mod 10000, padded to
// 4 digits - deterministic, so the buyer's `delivery-code` function and
// 4.7's `trip` function (checking the driver's entry) always agree without
// either one storing or looking anything up.
export async function deliveryOtp(pepper: string, escrowId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(escrowId)));
  const n = (digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3];
  const code = (n >>> 0) % 10000;
  return code.toString().padStart(4, "0");
}
