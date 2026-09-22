// One error shape for the whole app (CLAUDE.md §5 "In the app"). services/*
// turn every Supabase / function error into an AppError; components only
// ever see `error.messageKey`, never a raw server string.
const CODE_TO_MESSAGE_KEY = {
  OTP_INVALID: "errors.otpInvalid",
  OTP_EXPIRED: "errors.otpExpired",
  RATE_LIMITED: "errors.rateLimited",
  NETWORK_ERROR: "errors.network",
  PROFILE_NOT_FOUND: "errors.profileNotFound",
  LOCATION_DENIED: "errors.locationDenied",
  LOCATION_UNAVAILABLE: "errors.locationUnavailable",
  CAMERA_DENIED: "errors.cameraDenied",
  CAMERA_UNAVAILABLE: "errors.cameraUnavailable",
  UPLOAD_FAILED: "errors.uploadFailed",
  AI_UNAVAILABLE: "errors.aiUnavailable",
  KYC_ALREADY_VERIFIED: "errors.kycAlreadyVerified",
  KYC_UNAVAILABLE: "errors.kycUnavailable",
  LOT_NOT_LISTABLE: "errors.lotNotListable",
  BUYER_NOT_VERIFIED: "errors.buyerNotVerified",
  LOT_NOT_LISTED: "errors.lotNotListed",
  LOT_NOT_FOUND: "errors.lotNotFound",
  BID_NOT_ACTIVE: "errors.bidNotActive",
  // Never reachable through the UI (RequireAuth already guards every screen
  // that calls place_bid) - reuses the existing copy rather than a new key
  // for a defensive-only path.
  NOT_SIGNED_IN: "errors.profileNotFound",
} as const;

// A literal union matching real locale keys, not `string` - so every call
// site's `t(error.messageKey)` type-checks against the real translation keys.
type MessageKey = (typeof CODE_TO_MESSAGE_KEY)[keyof typeof CODE_TO_MESSAGE_KEY] | "errors.unknown";

export class AppError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
  }

  get messageKey(): MessageKey {
    return (CODE_TO_MESSAGE_KEY as Record<string, MessageKey>)[this.code] ?? "errors.unknown";
  }
}

// The message a browser's fetch() throws when the request never reached a
// server (offline, DNS, blocked CORS pre-flight) - matched on top of the
// navigator.onLine check below, since that flag is only ever a hint (a
// captive portal or a blocked pre-flight still reports "online"). Checked
// on both a thrown Error and a plain { message } object, because Supabase's
// PostgrestError isn't an Error instance.
const FETCH_FAILURE_RE = /Failed to fetch|NetworkError|Load failed|Network request failed/;

function isFetchFailure(err: unknown): boolean {
  const message = err instanceof Error ? err.message : (err as { message?: unknown } | null)?.message;
  return typeof message === "string" && FETCH_FAILURE_RE.test(message);
}

/** Wraps any thrown value as an AppError, so services never leak raw errors. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (!navigator.onLine || isFetchFailure(err)) {
    return new AppError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
  return new AppError("UNKNOWN", err instanceof Error ? err.message : String(err));
}

/**
 * Wraps a `supabase.rpc()` error as an AppError (place_bid, and every later
 * RPC: accept_bid in 3.6, escrow_transition in M4). AGENTS.md §5 "SQL
 * functions raise exceptions with the code as the message ... the app reads
 * the first word of the message as the code" - a PostgrestError's `.message`
 * is exactly that raised text (e.g. "BUYER_NOT_VERIFIED"), unlike an Edge
 * Function's `{ ok: false, error: { code } }` shape that callFunction.ts
 * unwraps instead.
 */
export function rpcError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (!navigator.onLine || isFetchFailure(err)) {
    return new AppError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
  const message = err instanceof Error ? err.message : (err as { message?: unknown } | null)?.message;
  if (typeof message === "string" && message.trim()) {
    return new AppError(message.trim().split(/\s/)[0], message);
  }
  return toAppError(err);
}
