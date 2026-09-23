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

// The deployed URL is always .../functions/v1/<fn-name>[/more/path] - the
// last segment is only the function name for a function with no
// sub-routes. `trip` (4.7) has both a token and a sub-route after its own
// name (/trip/<token>/otp), and the last segment there is the token -
// exactly what CLAUDE.md §5 "never log trip tokens" forbids. Anchoring on
// "v1" instead of "pop()" gets the real function name regardless of how
// many segments follow it.
function fnNameFromUrl(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const v1 = segments.indexOf("v1");
  return (v1 >= 0 ? segments[v1 + 1] : segments[0]) ?? "unknown";
}

async function run(fn: Handler, req: Request): Promise<Response> {
  // fn name for the log line (CLAUDE.md §5 "Log as JSON: { fn, code, ... }")
  // - requestId/userId aren't threaded through this generic wrapper yet,
  // only fn and code are known at this point.
  const fnName = fnNameFromUrl(req.url);
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

// A Postgres function's raised text is "CODE extra words" (AGENTS.md §5) -
// most functions collapse every RPC error to INTERNAL because their own
// checks already rule out the specific ones, but a caller whose own state
// can be stale (the driver's trip page, 4.9's cron sweep) needs the real
// code back as a translatable messageKey instead of a blank "something
// went wrong". Shared so `trip`'s own RPC calls (record_pod,
// record_otp_attempt) and `_shared/release.ts` (release_escrow) don't each
// keep their own copy of this mapping.
export function rpcAppError(message: string | undefined): AppError {
  const code = (message ?? "").trim().split(/\s/)[0] || "INTERNAL";
  const status =
    code === "ESCROW_WRONG_STATE" || code === "OTP_LOCKED"
      ? 409
      : code === "SHIPMENT_NOT_FOUND" || code === "ESCROW_NOT_FOUND"
        ? 404
        : 500;
  return new AppError(code, status, message);
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
