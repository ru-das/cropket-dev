// One error shape for the whole app (CLAUDE.md §5 "In the app"). services/*
// turn every Supabase / function error into an AppError; components only
// ever see `error.messageKey`, never a raw server string.
const CODE_TO_MESSAGE_KEY = {
  OTP_INVALID: "errors.otpInvalid",
  OTP_EXPIRED: "errors.otpExpired",
  RATE_LIMITED: "errors.rateLimited",
  NETWORK_ERROR: "errors.network",
  PROFILE_NOT_FOUND: "errors.profileNotFound",
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

/** Wraps any thrown value as an AppError, so services never leak raw errors. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error && !navigator.onLine) return new AppError("NETWORK_ERROR", err.message);
  return new AppError("UNKNOWN", err instanceof Error ? err.message : String(err));
}
