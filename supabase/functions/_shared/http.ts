// One error shape for every Edge Function (CLAUDE.md §5, SPEC.md §5.1).
// index.ts files wrap their handler in handle() so a bad-input error, a
// known AppError and a genuine bug all come back as the same
// { ok, data } / { ok, error: { code, messageKey } } JSON - never a raw
// stack trace, and never a leaked secret or phone number in the response.
//
// handle() also answers the browser's CORS pre-flight and stamps CORS
// headers on every reply (CLAUDE.md §7 Learned Rules, 2026-09-17) - every
// function has `verify_jwt = false` (config.toml) so Supabase's own gateway
// never rejects the pre-flight (it carries no Authorization header) before
// this code gets a chance to answer it.
import { z } from "zod";
// Cycle with env.ts (env.ts doesn't import this file at module scope, only
// inside requireEnv's body) - both sides are only used from inside a
// function's handler, never at import time, so this is safe. Not worth a
// fourth shared file just to avoid it.
import { getEnv } from "./env.ts";

export class AppError extends Error {
  status: number;
  code: string;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
}

// BID_BELOW_FLOOR -> errors.bidBelowFloor, matching CLAUDE.md §5's example
// and the app's own locale key style (app/src/lib/errors.ts) - one rule
// instead of a second hand-kept map that could drift from the first.
function toMessageKey(code: string): string {
  return "errors." + code.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

type Handler = (req: Request) => Promise<Response>;

// ALLOWED_ORIGINS is a comma-separated list (CLAUDE.md §2 "API keys"). Unset
// means "*" - these functions authenticate with an Authorization header, not
// a cookie, so a wildcard leaks nothing; it just also means any site could
// call them with a stolen token, which is no worse than any public API. Set
// it once the web app has a real domain (M5 web deploy).
function corsHeaders(req: Request): Record<string, string> {
  const base: Record<string, string> = {
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info, idempotency-key",
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-max-age": "86400",
  };
  const allowList = getEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowList.length === 0) return { ...base, "access-control-allow-origin": "*" };

  const origin = req.headers.get("origin") ?? "";
  if (!allowList.includes(origin)) return base; // no allow-origin header - the browser blocks it
  return { ...base, "access-control-allow-origin": origin, vary: "Origin" };
}

async function run(fn: Handler, req: Request): Promise<Response> {
  // fn name for the log line (CLAUDE.md §5 "Log as JSON: { fn, code, ... }")
  // - requestId/userId aren't threaded through this generic wrapper yet,
  // only fn and code are known at this point.
  const fnName = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "unknown";
  try {
    return await fn(req);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(JSON.stringify({ fn: fnName, code: "VALIDATION_FAILED" }));
      return json(
        { ok: false, error: { code: "VALIDATION_FAILED", messageKey: toMessageKey("VALIDATION_FAILED") } },
        { status: 400 },
      );
    }
    if (err instanceof AppError) {
      console.log(JSON.stringify({ fn: fnName, code: err.code }));
      return json(
        { ok: false, error: { code: err.code, messageKey: toMessageKey(err.code) } },
        { status: err.status },
      );
    }
    // Anything else is our bug - details go to the log only, never the response.
    console.error(
      JSON.stringify({ fn: fnName, code: "INTERNAL", message: err instanceof Error ? err.message : String(err) }),
    );
    return json(
      { ok: false, error: { code: "INTERNAL", messageKey: toMessageKey("INTERNAL") } },
      { status: 500 },
    );
  }
}

export function handle(fn: Handler): Handler {
  return async (req: Request) => {
    const cors = corsHeaders(req);
    // Answered before anything else runs: the pre-flight carries no
    // Authorization header, so it must never reach requireRole() /
    // requireCronSecret() (CLAUDE.md §7 Learned Rules, 2026-09-17).
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const res = await run(fn, req);
    for (const [name, value] of Object.entries(cors)) res.headers.set(name, value);
    return res;
  };
}
