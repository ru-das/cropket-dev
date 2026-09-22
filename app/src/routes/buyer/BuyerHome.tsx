// Buyer home - real marketplace tiles land in M3 (SPEC.md §4.10). For now
// this exists so login routes buyers to their own home, not the farmer one.
// Sign out lives here since buyer has no bottom nav / Me tab yet.
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import { Building2, LogOut, Sparkles, TriangleAlert } from "lucide-react";
import { useAuth } from "@/app/authContext";
import { signOut } from "@/services/auth";
import VerifiedBadge from "@/components/common/VerifiedBadge";

export default function BuyerHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const verified = profile?.kyc_status === "verified";

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-line bg-surface p-6 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-neel/30 bg-neel-light text-neel-text shadow-xs">
            <Building2 size={32} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-black tracking-tight text-ink">
              {t("home.greeting", { name: profile?.name ?? "" })}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-block rounded-full border border-neel/30 bg-neel-light px-3 py-0.5 font-display text-xs font-bold text-neel-text">
                {t("role.buyer")}
              </span>
              {verified && <VerifiedBadge verified />}
            </div>
          </div>
        </div>
      </div>

      {!verified && (
        <Link
          to="/buyer/kyc"
          className="flex items-center gap-3.5 rounded-2xl border-2 border-haldi/40 bg-haldi-light p-4 shadow-card transition-all active:scale-[0.98] hover:bg-haldi-light/80"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-haldi/30 bg-surface text-haldi-text shadow-xs">
            <TriangleAlert aria-hidden="true" size={22} className="stroke-[2.5]" />
          </div>
          <p className="flex-1 font-display text-base font-bold leading-snug text-haldi-text">
            {t("kyc.buyerHomeBanner")}
          </p>
          <span className="shrink-0 font-display text-sm font-bold text-haldi-text underline underline-offset-2">
            {t("kyc.buyerHomeBannerCta")}
          </span>
        </Link>
      )}

      <div className="rounded-3xl border-2 border-dashed border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neel-light text-neel-text border border-neel/20">
          <Sparkles size={28} aria-hidden="true" />
        </div>
        <p className="mt-4 font-display text-xl font-bold text-ink">{t("common.comingSoon")}</p>
      </div>

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
