// Admin home - a desktop screen, online only (SPEC.md §3.1). Disputes and
// user management land later in M3/M4; KYC approve (3.1) is the first.
// Sign out lives here since admin has no bottom nav "Me" tab (BottomNav
// renders nothing for this role).
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import { Shield, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
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
      <div className="rounded-3xl border-2 border-line bg-surface p-6 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-haldi/30 bg-haldi-light text-haldi-text shadow-glow-haldi">
            <Shield size={32} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-black tracking-tight text-ink">
              {t("home.greeting", { name: profile?.name ?? "" })}
            </h1>
            <span className="mt-1 inline-block rounded-full border border-haldi/30 bg-haldi-light px-3 py-0.5 font-display text-xs font-bold text-haldi-text">
              {profile && t(`role.${profile.role}`)}
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/admin/kyc"
        className="flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-5 shadow-card transition-all active:scale-[0.98] hover:border-haldi/40"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-haldi/20 bg-haldi-light text-haldi-text">
          <ShieldCheck size={26} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-ink">{t("kyc.adminTitle")}</p>
          <p className="text-meta text-ink-muted">{t("kyc.adminSubtitle")}</p>
        </div>
        <ChevronRight aria-hidden="true" size={22} className="shrink-0 text-ink-muted" />
      </Link>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-mirchi/40 bg-mirchi-light font-display text-lg font-bold text-mirchi-text shadow-card transition-all hover:bg-mirchi-light/80 active:scale-95"
      >
        <LogOut size={20} aria-hidden="true" />
        <span>{t("me.signOut")}</span>
      </button>
    </div>
  );
}
