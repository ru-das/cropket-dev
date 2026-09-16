// Admin home - a desktop screen, online only (SPEC.md §3.1). Disputes, user
// and KYC management land in M3/M4. Sign out lives here since admin has no
// bottom nav "Me" tab (BottomNav renders nothing for this role).
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
    <div className="mx-auto max-w-md">
      <p className="text-title font-display text-ink">
        {t("home.greeting", { name: profile?.name ?? "" })}
      </p>
      <p className="mt-2 text-body text-ink-muted">{t("common.comingSoon")}</p>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-8 h-14 rounded-button border border-mirchi px-6 text-body font-semibold text-mirchi-text"
      >
        {t("me.signOut")}
      </button>
    </div>
  );
}
