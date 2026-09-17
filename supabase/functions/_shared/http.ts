// One error shape for every Edge Function (CLAUDE.md §5, SPEC.md §5.1).
// index.ts files wrap their handler in handle() so a bad-input error, a
// known AppError and a genuine bug all come back as the same
// { ok, data } / { ok, error: { code, messageKey } } JSON - never a raw
// stack trace, and never a leaked secret or phone number in the response.
import { z } from "zod";

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

export function handle(fn: Handler): Handler {
  return async (req: Request) => {
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
  };
}
