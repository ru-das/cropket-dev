// FPO home - mega lot tools land in M3 (SPEC.md §4.10 mega lots). For now
// this exists so login routes FPOs to their own home, not the farmer one.
// Sign out lives here since FPO has no bottom nav / Me tab yet.
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/authContext";
import { signOut } from "@/services/auth";

export default function FpoHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div>
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
