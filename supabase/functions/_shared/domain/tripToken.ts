// The driver trip link's token (SPEC.md §4.16, §5.4, §5.6, §9.2 Phase 4
// "4.7"). Same reasoning as deliveryOtp.ts: only the hash is ever stored
// (`shipments.trip_token_hash`), never the token itself, so a database
// leak reveals no working link. Pure Web Crypto, no Deno/env import - so
// Vitest can call this directly, like deliveryOtp.ts.
export function newTripToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // base64url, no padding - safe to drop straight into a URL path segment
  // with no escaping (`/t/<token>`).
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function hashTripToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
