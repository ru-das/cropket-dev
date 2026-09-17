// The only reader of Deno.env in the Edge Functions (CLAUDE.md §4). getEnv()
// may come back empty (never fatal); requireEnv() is for a must-have secret
// with no mock (CLAUDE.md §5) - it fails the whole call closed rather than
// running with a blank secret.
import { AppError } from "./http.ts";

export function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new AppError("SETUP_MISSING_KEY", 500, `SETUP_MISSING_KEY ${name}`);
  return value;
}
