// Wraps the whole app: the persisted TanStack Query client (offline/persist.ts,
// SPEC.md §5.8 "Reads") and, inside it, the signed-in session + profile
// (used by guards.tsx). The Supabase session stays in localStorage - that's
// supabase-js's own job and is what makes offline app start work at all
// (SPEC.md §5.8 rule 8). The profile is a query now, so it survives a reload
// with no internet via IndexedDB instead of a hand-rolled cache.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthContext, type AuthState } from "./authContext";
import { getSession, onAuthChange } from "@/services/auth";
import { profileKeys, useMyProfile } from "@/services/profiles";
import { queryClient, persistOptions } from "@/offline/persist";
import { startSync } from "@/offline/sync";

type SessionState = "loading" | "signedOut" | "signedIn";

function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const s = await getSession();
      if (cancelled) return;
      setSession(s);
      setSessionState(s ? "signedIn" : "signedOut");
    })();

    const unsubscribe = onAuthChange((s) => {
      setSession(s);
      if (s) {
        setSessionState("signedIn");
      } else {
        queryClient.clear(); // don't leak the last user's cached data to the next sign-in
        setSessionState("signedOut");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [queryClient]);

  const profileQuery = useMyProfile(sessionState === "signedIn");

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: profileKeys.mine() });
  }, [queryClient]);

  // Still restoring the IndexedDB cache, or waiting on the first-ever fetch
  // with nothing cached yet: don't flash "signed in, no profile" at onboarding.
  const status: AuthState["status"] =
    sessionState !== "signedIn"
      ? sessionState
      : isRestoring || profileQuery.isPending
        ? "loading"
        : "signedIn";

  const value: AuthState = {
    status,
    session,
    profile: profileQuery.data ?? null,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => startSync(), []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <AuthProvider>{children}</AuthProvider>
    </PersistQueryClientProvider>
  );
}
