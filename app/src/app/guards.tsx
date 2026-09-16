// Route guards (SPEC.md §3.1 roles per route). RequireAuth only checks the
// session - it wraps both /onboarding and every role branch. RequireRole
// checks profile + role and is only used on the role branches, so it also
// catches "session but no profile yet" → /onboarding (SPEC.md §4.3: role is
// picked once, right after first login).
import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "./authContext";
import { homeFor } from "@/lib/roles";
import type { Role } from "@shared/schemas/profile.ts";

// SPEC.md §4.22 "Loading: grey blocks in the shape of the content, never a
// spinner over 1 s without text."
function LoadingSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-field p-4">
      <p className="animate-pulse text-body text-ink-muted">{t("common.loading")}</p>
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingSkeleton />;
  if (status === "signedOut") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile } = useAuth();

  if (!profile) return <Navigate to="/onboarding" replace />;
  if (!roles.includes(profile.role)) return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}
