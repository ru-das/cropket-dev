// Pure HMAC-SHA256 signature helper for Cashfree webhooks (SPEC.md §5.4
// "Verifies signature first", CLAUDE.md §5 "Webhooks: verify the Cashfree
// signature first (bad -> 401)"). Cashfree's PG v2 webhook signature is
// base64(HMAC-SHA256(timestamp + rawBody)). No Deno/env import - only Web
// Crypto (`crypto.subtle`) and `btoa`, both present in Deno and in Node 20+
// - so Vitest can call this directly, same as digilocker's pure mock.ts.
export async function cashfreeSignature(secret: string, timestamp: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  return btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
}
