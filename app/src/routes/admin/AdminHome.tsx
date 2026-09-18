// Admin home - a desktop screen, online only (SPEC.md §3.1). Disputes, user
// and KYC management land in M3/M4. Sign out lives here since admin has no
// bottom nav "Me" tab (BottomNav renders nothing for this role).
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Shield, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/app/authContext";
import { signOut } from "@/services/auth";

export default function AdminHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-haldi-light text-haldi-text">
            <Shield size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink">
              {t("home.greeting", { name: profile?.name ?? "" })}
            </h1>
            <span className="mt-0.5 inline-block rounded-full bg-haldi-light px-2.5 py-0.5 text-xs font-bold text-haldi-text">
              {profile && t(`role.${profile.role}`)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-surface-subtle/50 p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-haldi-light text-haldi-text">
          <Sparkles size={24} aria-hidden="true" />
        </div>
        <p className="mt-3 font-display text-lg font-bold text-ink">{t("common.comingSoon")}</p>
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-mirchi/40 bg-mirchi-light text-body font-bold text-mirchi-text shadow-xs transition-transform hover:bg-mirchi/15 active:scale-97"
      >
        <LogOut size={18} aria-hidden="true" />
        <span>{t("me.signOut")}</span>
      </button>
    </div>
  );
}
