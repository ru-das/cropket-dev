// Holds the signed-in session + profile for the whole app (used by
// guards.tsx). Caches {id, name, role, language} in localStorage (try/catch,
// same pattern as lib/i18n.ts) so a signed-in farmer's home screen still
// renders while offline - SPEC.md §9.2 Phase 0 "Done when: the APK opens in
// airplane mode and shows the home screen."
// ponytail: this localStorage cache is a stand-in for the real TanStack
// Query + IndexedDB persistence that lands in 0.6 - swap it out then.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext, type AuthState } from "./authContext";
import { getSession, onAuthChange } from "@/services/auth";
import { getMyProfile, type Profile } from "@/services/profiles";

const CACHE_KEY = "cropket.profile";

function readCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: Profile | null) {
  try {
    if (profile) localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore - a cache miss just means the offline fallback below won't fire
  }
}

type ProviderState = Omit<AuthState, "refreshProfile">;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({
    status: "loading",
    session: null,
    profile: null,
  });

  const loadProfile = useCallback(async (session: Session) => {
    try {
      const profile = await getMyProfile();
      writeCachedProfile(profile);
      setState({ status: "signedIn", session, profile });
    } catch {
      // Offline or a network hiccup: fall back to the cached profile rather
      // than bouncing a signed-in farmer to onboarding.
      setState({ status: "signedIn", session, profile: readCachedProfile() });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await getSession();
      if (cancelled) return;
      if (session) await loadProfile(session);
      else setState({ status: "signedOut", session: null, profile: null });
    })();

    const unsubscribe = onAuthChange((session) => {
      if (session) void loadProfile(session);
      else {
        writeCachedProfile(null);
        setState({ status: "signedOut", session: null, profile: null });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (state.session) await loadProfile(state.session);
  }, [state.session, loadProfile]);

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile }}>{children}</AuthContext.Provider>
  );
}
