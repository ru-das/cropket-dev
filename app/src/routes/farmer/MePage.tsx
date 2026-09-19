// Farmer's own profile + sign out (SPEC.md §4.4 "👤 Me" tab). This is how
// login/logout gets hand-tested until a real profile-edit screen exists.
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/app/authContext";
import LanguageSwitch from "@/components/shell/LanguageSwitch";
import { signOut } from "@/services/auth";

export default function MePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <h1 className="text-title font-display text-ink">{t("nav.me")}</h1>

      <div className="mt-4 rounded-card border border-line-soft bg-surface p-4 shadow-[var(--shadow-soft)]">
        <p className="text-card font-semibold text-ink">{profile?.name}</p>
        <p className="mt-1 text-meta text-ink-muted">{profile?.phone}</p>
        {profile && <p className="mt-1 text-meta text-ink-muted">{t(`role.${profile.role}`)}</p>}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-card border border-line-soft bg-surface p-4 shadow-[var(--shadow-soft)]">
        <span className="text-body text-ink">{t("lang.switchLabel")}</span>
        <LanguageSwitch />
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-button border border-mirchi/30 bg-surface text-body font-semibold text-mirchi-text shadow-[var(--shadow-soft)]"
      >
        <LogOut aria-hidden="true" size={18} />
        {t("me.signOut")}
      </button>
    </div>
  );
}
