// Phone OTP login (SPEC.md §4.2, §9.5 "real, test numbers"). The only file
// that calls supabase.auth.* - pages call these functions, never the client
// directly (CLAUDE.md §3). Sends the bare 10-digit number, not E.164 - see
// the comment on Phone10 in the shared schema for why.
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import type { Phone10 } from "@shared/schemas/profile.ts";
import type { Session } from "@supabase/supabase-js";

export async function sendOtp(phone10: Phone10): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone: phone10 });
  if (error) throw mapAuthError(error);
}

export async function verifyOtp(phone10: Phone10, code: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone10,
    token: code,
    type: "sms",
  });
  if (error || !data.session) throw mapAuthError(error);
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => subscription.unsubscribe();
}

function mapAuthError(error: { message: string; status?: number } | null): AppError {
  const message = error?.message ?? "";
  if (/expired/i.test(message)) return new AppError("OTP_EXPIRED", message);
  if (/invalid|token/i.test(message)) return new AppError("OTP_INVALID", message);
  if (error?.status === 429 || /rate limit/i.test(message))
    return new AppError("RATE_LIMITED", message);
  return toAppError(error ?? new Error("unknown auth error"));
}
