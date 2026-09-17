// Verifies the caller's JWT and reads their role from `profiles` - never
// from the request body, so a client can never claim a role it doesn't have
// (CLAUDE.md §4 "the role is always read from profiles on the server").
// Every function has `verify_jwt = false` (config.toml) so Supabase's own
// gateway never checks the token - db.auth.getUser(token) below is that
// check now, done by us, on every call (CLAUDE.md §7 Learned Rules,
// 2026-09-17).
import { AppError } from "./http.ts";
import { requireEnv } from "./env.ts";
import { db } from "./db.ts";

export type AuthedUser = { id: string; role: string };

export async function requireRole(req: Request, roles: string[]): Promise<AuthedUser> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError("UNAUTHENTICATED", 401);

  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser(token);
  if (userError || !user) throw new AppError("UNAUTHENTICATED", 401);

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role, banned")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) throw new AppError("PROFILE_NOT_FOUND", 404);
  if (profile.banned) throw new AppError("BANNED", 403);
  if (!roles.includes(profile.role)) throw new AppError("FORBIDDEN", 403);

  return { id: user.id, role: profile.role };
}

/**
 * For cron/webhook/driver-link functions (no user JWT at all): the caller
 * proves itself with a shared secret in the Authorization header instead
 * (SPEC.md §5.2 "Functions for webhooks, cron and the driver link ... check
 * their own secret"). requireEnv fails closed with SETUP_MISSING_KEY if
 * CRON_SECRET was never set - there is no mock for a secret like this one.
 */
export function requireCronSecret(req: Request): void {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token !== requireEnv("CRON_SECRET")) throw new AppError("UNAUTHENTICATED", 401);
}
