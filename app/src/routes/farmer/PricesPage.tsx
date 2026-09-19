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

// Lazy: maplibre-gl is only fetched when a map is actually shown (CLAUDE.md
// §4 "first screen JS < 200 KB").
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
  // isError with no cached data means the fetch failed and there is nothing
  // saved to fall back to (SPEC.md §5.8 still shows the saved copy when
  // there is one) - offer a retry instead of "Loading..." forever.
  if (isError && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-mirchi/40 bg-mirchi-light p-6 text-center shadow-card">
        <p className="text-body font-semibold text-mirchi-text">{t("common.loadFailed")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="h-12 rounded-xl border border-mirchi-text px-5 text-body font-bold text-mirchi-text transition-transform active:scale-97"
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-display text-3xl font-black tracking-tight text-ink">
            {t("prices.title", { crop: t(`crop.${crop}`) })}
          </h1>
        </div>
        <VoiceButton textKey="prices.title" values={{ crop: t(`crop.${crop}`) }} className="h-11 w-11 shadow-xs" />
      </div>

      {crops.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {crops.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              className={`flex h-12 shrink-0 items-center gap-2 rounded-2xl px-5 font-display text-base font-bold transition-all active:scale-95 ${
                c === crop
                  ? "border-2 border-leaf bg-leaf text-white shadow-premium scale-105"
                  : "border-2 border-line bg-surface text-ink shadow-card hover:border-leaf/40"
              }`}
            >
              <span aria-hidden="true" className="text-xl">{c === "onion" ? "🧅" : c === "tomato" ? "🍅" : "🥔"}</span>
              <span>{t(`crop.${c}`)}</span>
            </button>
          ))}
        </div>
      )}

      {hero && <PriceHero hero={hero} updatedAt={new Date(dataUpdatedAt)} />}

      {config.maptilerKey && online && (
        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl bg-line" />}>
          <MandiHeatmap mandiPrices={data.mandiPrices} farmerLocation={farmerLocation} />
        </Suspense>
      )}
      <MandiList mandiPrices={data.mandiPrices} />

      {data.advice && <AdviceCard advice={data.advice} />}

      {belowFloor && data.floorPaise !== null && <FloorWarning floorPaise={data.floorPaise} />}
    </div>
  );
}
