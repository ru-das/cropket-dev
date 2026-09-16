// Context + hook for the current session/profile. Split from providers.tsx
// so a plain `export const AuthContext` next to a component doesn't trip
// react-refresh/only-export-components (eslint.config.js).
import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@/services/profiles";

export type AuthState = {
  /** "loading" until the first session check finishes. */
  status: "loading" | "signedOut" | "signedIn";
  session: Session | null;
  /** null once signed in but before onboarding (role pick) is done. */
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() used outside <AuthProvider>");
  return ctx;
}
