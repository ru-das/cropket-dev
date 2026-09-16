// Buyer home - real marketplace tiles land in M3 (SPEC.md §4.10). For now
// this exists so login routes buyers to their own home, not the farmer one.
// Sign out lives here since buyer has no bottom nav / Me tab yet.
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/authContext";
import { signOut } from "@/services/auth";

export default function BuyerHome() {
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
