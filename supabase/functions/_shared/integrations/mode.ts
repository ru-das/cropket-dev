// SPEC.md §2.2 adapter pattern: isMock(name) is true when `name` is listed
// in INTEGRATIONS_MOCK (comma-separated) or any key that adapter needs is
// empty - a missing key never blocks work, the feature just runs in mock
// mode instead (CLAUDE.md §5).
import { getEnv } from "../env.ts";

const warned = new Set<string>();

export function isMock(name: string, requiredKeys: string[] = []): boolean {
  const mockList = getEnv("INTEGRATIONS_MOCK")
    .split(",")
    .map((s) => s.trim());
  if (mockList.includes(name)) return true;

  const missing = requiredKeys.filter((key) => !getEnv(key));
  if (missing.length === 0) return false;

  // Logged once per cold start, not once per call - a warm function would
  // otherwise spam this on every request.
  if (!warned.has(name)) {
    warned.add(name);
    console.warn(JSON.stringify({ code: "MISSING_KEY", integration: name, missing }));
  }
  return true;
}
