// Buyer home = the marketplace (SPEC.md §4.10, §9.2 Phase 3 "3.2b"). Browsing
// is open to every buyer, verified or not - only bidding (3.3) is blocked -
// so this page adds no RequireRole/kyc guard, just the banner it already had.
// All four filters run client-side over one fetch (routes/buyer/marketplace.ts
// filterAndSortLots()); photos for the whole page are signed in one batched
// call (services/lots.ts useListedLotPhotos()) instead of one per card.
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Building2, LogOut, PackageSearch, TriangleAlert } from "lucide-react";
import { useAuth } from "@/app/authContext";
import { signOut } from "@/services/auth";
import { useListedLots, useListedLotPhotos } from "@/services/lots";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import DemoDataTag from "@/components/common/DemoDataTag";
import BuyerLotCard from "@/components/lot/BuyerLotCard";
import LotFilters from "@/components/market/LotFilters";
import { filterAndSortLots, DEFAULT_MARKET_FILTERS } from "@/routes/buyer/marketplace";
import type { LatLng } from "@shared/geo.ts";

export default function BuyerHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const verified = profile?.kyc_status === "verified";

  const [filters, setFilters] = useState(DEFAULT_MARKET_FILTERS);
  const { data: lots, isLoading } = useListedLots();
  const gradeResultIds = useMemo(() => (lots ?? []).map((l) => l.gradeResultId), [lots]);
  const { data: photos } = useListedLotPhotos(gradeResultIds);

  const lat = profile?.lat;
  const lng = profile?.lng;
  const buyerLocation: LatLng | null = useMemo(
    () => (lat !== null && lat !== undefined && lng !== null && lng !== undefined ? { lat, lng } : null),
    [lat, lng],
  );

  const visible = useMemo(
    () => filterAndSortLots(lots ?? [], filters, buyerLocation),
    [lots, filters, buyerLocation],
  );

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

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-black text-ink">{t("market.title")}</h2>
        {!buyerLocation && <span className="text-meta text-ink-muted">{t("market.noLocationHint")}</span>}
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
        <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-display text-meta font-bold text-ink">{t("market.filterDistance")}</span>
            <DemoDataTag />
          </div>
          <LotFilters filters={filters} onChange={setFilters} />
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="font-display text-lg font-bold text-ink-muted">{t("common.loading")}</p>
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-line bg-surface p-8 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-line bg-surface-subtle text-ink-muted">
                <PackageSearch size={28} aria-hidden="true" />
              </div>
              <p className="mt-4 font-display text-xl font-bold text-ink">{t("market.empty")}</p>
              <p className="mt-1 text-meta text-ink-muted">{t("market.emptyHint")}</p>
            </div>
          ) : (
            <>
              <p className="text-meta font-semibold text-ink-muted">{t("market.lotCount", { count: visible.length })}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((lot) => (
                  <BuyerLotCard key={lot.id} lot={lot} photoUrl={photos?.[lot.gradeResultId]} />
                ))}
              </div>
            </>
          )}
        </div>
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
