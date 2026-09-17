// The short human code shown on a lot's QR label (SPEC.md §4.7 "L-2041").
// Pure TypeScript only (CLAUDE.md §4 "shared domain code") - used by
// app/src/services/lots.ts when it writes a lot offline, and by the app's
// QRLabel component to print the same code that's encoded in the QR square.
// Digits only, not hex - the code is meant to be read aloud and typed by
// hand, and not everyone reading it can read Latin letters.

/**
 * Turns a lot's uuid into a 6-digit code, e.g. "L-204173". Deterministic
 * (same id -> same code always), so it never needs to be stored or synced
 * separately from the id it labels. There's no uniqueness guarantee - a
 * clash is possible but rare, and a clash must never stop a real lot being
 * saved (see the migration's comment) - this is a display label, not a key.
 */
export function lotCode(id: string): string {
  const hex = id.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16) % 1_000_000;
  return `L-${n.toString().padStart(6, "0")}`;
}
