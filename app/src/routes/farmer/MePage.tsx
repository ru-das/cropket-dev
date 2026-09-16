// Farmer's own profile + sign out (SPEC.md §4.4 "👤 Me" tab). This is how
// login/logout gets hand-tested until a real profile-edit screen exists.
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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

      <div className="mt-4 rounded-card border border-line bg-surface p-4">
        <p className="text-card font-semibold text-ink">{profile?.name}</p>
        <p className="mt-1 text-meta text-ink-muted">{profile?.phone}</p>
        {profile && <p className="mt-1 text-meta text-ink-muted">{t(`role.${profile.role}`)}</p>}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-body text-ink">{t("lang.switchLabel")}</span>
        <LanguageSwitch />
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-8 h-14 w-full rounded-button border border-mirchi text-body font-semibold text-mirchi-text"
      >
        {t("me.signOut")}
      </button>
    </div>
  );
}
