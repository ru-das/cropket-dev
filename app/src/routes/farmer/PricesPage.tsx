// Prices screen (SPEC.md §4.8, §9.2 Phase 2 "2.4"): today's price, the
// mandi heat map (or list offline / no MapTiler key), sell/hold advice and
// the floor-price warning - all of it already computed by services/prices.ts
// from tables 2.1-2.3 built. Farmer-facing, so every value here can also be
// read straight from IndexedDB with no internet (SPEC.md §5.8).
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { isBelowFloor } from "@shared/floor.ts";
import type { Crop } from "@shared/crops.ts";
import type { LatLng } from "@shared/geo.ts";
import VoiceButton from "@/components/voice/VoiceButton";
import PriceHero from "@/components/market/PriceHero";
import AdviceCard from "@/components/market/AdviceCard";
import FloorWarning from "@/components/market/FloorWarning";
import MandiList from "@/components/market/MandiList";
import { useAuth } from "@/app/authContext";
import { useOnline } from "@/offline/network";
import { config } from "@/lib/config";
import { pickHeroMandi, useMarketData } from "@/services/prices";

const MandiHeatmap = lazy(() => import("@/components/market/MandiHeatmap"));

export default function PricesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const online = useOnline();

  const crops = (profile?.crops ?? []) as Crop[];
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(crops[0] ?? null);
  const crop = selectedCrop ?? crops[0] ?? null;

  const { data, dataUpdatedAt, isError, refetch } = useMarketData(crop ?? "onion");

  if (!crop) return <p className="text-body text-ink-muted">{t("common.loading")}</p>;
  if (isError && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-mirchi/30 bg-mirchi/5 p-4">
        <p className="text-body text-mirchi-text">{t("common.loadFailed")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="h-12 rounded-button border border-mirchi-text bg-surface px-4 text-body font-semibold text-mirchi-text shadow-[var(--shadow-soft)]"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }
  if (!data) return <p className="text-body text-ink-muted">{t("common.loading")}</p>;

  const farmerLocation: LatLng | null =
    profile?.lat !== null &&
    profile?.lat !== undefined &&
    profile?.lng !== null &&
    profile?.lng !== undefined
      ? { lat: profile.lat, lng: profile.lng }
      : null;

  const hero = pickHeroMandi({
    mandiPrices: data.mandiPrices,
    perishability: data.perishability,
    farmerLocation,
  });
  const belowFloor =
    hero !== null &&
    data.floorPaise !== null &&
    isBelowFloor(hero.modalPricePaise, data.floorPaise);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">
            {t("prices.title", { crop: t(`crop.${crop}`) })}
          </h1>
        </div>
        <VoiceButton textKey="prices.title" values={{ crop: t(`crop.${crop}`) }} />
      </div>

      {crops.length > 1 && (
        <div className="flex gap-2">
          {crops.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              className={
                c === crop
                  ? "h-12 rounded-button border border-leaf bg-leaf px-4 text-body font-semibold text-white shadow-[var(--shadow-soft)]"
                  : "h-12 rounded-button border border-line-soft bg-surface px-4 text-body font-semibold text-ink shadow-[var(--shadow-soft)]"
              }
            >
              {t(`crop.${c}`)}
            </button>
          ))}
        </div>
      )}

      {hero && <PriceHero hero={hero} updatedAt={new Date(dataUpdatedAt)} />}

      {config.maptilerKey && online && (
        <Suspense fallback={<div className="h-64 w-full animate-shimmer rounded-card" />}>
          <MandiHeatmap mandiPrices={data.mandiPrices} farmerLocation={farmerLocation} />
        </Suspense>
      )}
      <MandiList mandiPrices={data.mandiPrices} />

      {data.advice && <AdviceCard advice={data.advice} />}

      {belowFloor && data.floorPaise !== null && <FloorWarning floorPaise={data.floorPaise} />}
    </div>
  );
}
