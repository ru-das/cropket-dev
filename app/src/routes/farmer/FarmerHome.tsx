// Farmer home (SPEC.md §4.4). Modern consumer app architecture inspired by
// Uber, Swiggy and Flipkart: Hero scan action + quick service pods + live
// market pulse + recent lot activity.
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Camera,
  Package,
  TrendingUp,
  BookText,
  ArrowRight,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/app/authContext";
import BigTile from "@/components/common/BigTile";
import VoiceButton from "@/components/voice/VoiceButton";
import LotCard from "@/components/lot/LotCard";
import { useMyLots, usePendingLots } from "@/services/lots";
import { useMarketData, pickHeroMandi } from "@/services/prices";
import { formatRupees } from "@shared/money.ts";
import type { Crop } from "@shared/crops.ts";
import type { LatLng } from "@shared/geo.ts";
import logoSrc from "@/assets/cropket-logo.png";

export default function FarmerHome() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const name = profile?.name ?? "";
  const crop = ((profile?.crops ?? [])[0] ?? "onion") as Crop;

  // Real lots for activity section & count badge
  const { data: pending } = usePendingLots();
  const { data: mine } = useMyLots();
  const allLots = [...(pending ?? []), ...(mine ?? [])];
  const recentLot = allLots[0] ?? null;

  const farmerLocation: LatLng | null =
    profile?.lat !== null &&
    profile?.lat !== undefined &&
    profile?.lng !== null &&
    profile?.lng !== undefined
      ? { lat: profile.lat, lng: profile.lng }
      : null;

  // Market pulse
  const { data: marketData } = useMarketData(crop);
  const heroMandi = marketData
    ? pickHeroMandi({
        mandiPrices: marketData.mandiPrices,
        perishability: marketData.perishability,
        farmerLocation,
      })
    : null;

  const priceChange =
    heroMandi && heroMandi.yesterdayModalPricePaise !== null
      ? heroMandi.modalPricePaise - heroMandi.yesterdayModalPricePaise
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Top Greeting & Context Bar ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
              {t("home.greeting", { name })}
            </h1>
            <div className="flex items-center gap-2 font-display text-xs font-semibold text-ink-muted">
              <span>{t(`crop.${crop}`)}</span>
              {profile?.village && (
                <>
                  <span>•</span>
                  <span>{profile.village}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <VoiceButton textKey="home.greeting" values={{ name }} className="h-10 w-10 shadow-xs" />
      </div>

      {/* ── 2. Hero Action Banner (Uber 'Where to?' / Swiggy Hero) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-leaf/30 bg-gradient-to-br from-leaf-light via-surface to-surface p-5 shadow-card transition-all hover:border-leaf/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-md">
            <h2 className="font-display text-2xl font-black text-ink leading-tight">
              {t("home.scanCropHero")}
            </h2>
            <p className="mt-1 font-display text-sm font-semibold text-ink-muted leading-snug">
              {t("home.scanCropDesc")}
            </p>

            <Link
              to="/farmer/scan"
              className="mt-4 inline-flex h-14 items-center justify-center gap-2.5 rounded-xl bg-leaf px-6 font-display text-base font-bold text-white shadow-premium transition-all hover:bg-leaf-hover active:scale-[0.98]"
            >
              <Camera aria-hidden="true" size={20} className="stroke-[2.5]" />
              <span>{t("home.scanNow")}</span>
              <ArrowRight aria-hidden="true" size={18} className="stroke-[2.5]" />
            </Link>
          </div>

          {/* Viewfinder Graphic Anchor */}
          <div
            aria-hidden="true"
            className="hidden sm:flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-leaf/40 bg-surface/80 text-4xl shadow-xs"
          >
            {crop === "onion" ? "🧅" : crop === "tomato" ? "🍅" : "🥔"}
          </div>
        </div>
      </div>

      {/* ── 3. Quick-Service Pods (Flipkart / Swiggy style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <BigTile
          icon={Package}
          labelKey="home.myLots"
          href="/farmer/lots"
          descKey="home.myLotsDesc"
          badge={allLots.length > 0 ? `${allLots.length}` : undefined}
        />
        <BigTile
          icon={TrendingUp}
          labelKey="home.todaysPrice"
          href="/farmer/prices"
          descKey="home.todaysPriceDesc"
          badge={heroMandi ? formatRupees(heroMandi.modalPricePaise) : undefined}
        />
        <BigTile
          icon={BookText}
          labelKey="home.myKhata"
          href="/farmer/khata"
          descKey="home.myKhataDesc"
        />
      </div>

      {/* ── 4. Live Market Pulse Ticker ── */}
      {heroMandi && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pass opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pass" />
              </span>
              <span className="font-display text-base font-bold text-ink">
                {t("home.marketPulse")}
              </span>
            </div>
            <Link
              to="/farmer/prices"
              className="flex items-center gap-1 font-display text-xs font-bold text-leaf hover:underline"
            >
              <span>{t("home.viewAllMandis")}</span>
              <ChevronRight aria-hidden="true" size={14} />
            </Link>
          </div>

          <Link
            to="/farmer/prices"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:border-leaf/50 hover:shadow-premium active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-line text-2xl">
                {crop === "onion" ? "🧅" : crop === "tomato" ? "🍅" : "🥔"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-display text-lg font-bold text-ink truncate">
                    {t(`crop.${crop}`)}
                  </span>
                  <span className="font-display text-xs font-semibold text-ink-muted truncate">
                    · {heroMandi.mandi.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                  <MapPin aria-hidden="true" size={13} className="text-ink-muted shrink-0" />
                  <span className="font-display truncate">{heroMandi.mandi.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-end flex-col gap-1 shrink-0">
              <span className="font-display text-2xl font-black tabular-nums text-ink">
                {formatRupees(heroMandi.modalPricePaise)}
              </span>
              {priceChange !== null && priceChange !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-xs font-black tabular-nums ${
                    priceChange > 0
                      ? "bg-pass-light text-pass-text"
                      : "bg-mirchi-light text-mirchi-text"
                  }`}
                >
                  {priceChange > 0 ? (
                    <ArrowUp aria-hidden="true" size={12} className="stroke-[3]" />
                  ) : (
                    <ArrowDown aria-hidden="true" size={12} className="stroke-[3]" />
                  )}
                  <span>{formatRupees(Math.abs(priceChange))}</span>
                </span>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* ── 5. Recent Activity / Lots Section ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-base font-bold text-ink">
            {t("home.recentLots")}
          </span>
          {allLots.length > 0 && (
            <Link
              to="/farmer/lots"
              className="flex items-center gap-1 font-display text-xs font-bold text-leaf hover:underline"
            >
              <span>{t("home.viewAllLots")}</span>
              <ChevronRight aria-hidden="true" size={14} />
            </Link>
          )}
        </div>

        {recentLot ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <LotCard lot={recentLot} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 text-left shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-line text-xl">
                📦
              </div>
              <div>
                <p className="font-display text-sm font-bold text-ink">
                  {t("home.noLotsYet")}
                </p>
                <p className="font-display text-xs text-ink-muted">
                  {t("home.scanCropDesc")}
                </p>
              </div>
            </div>
            <Link
              to="/farmer/scan"
              className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-leaf-light px-4 font-display text-xs font-bold text-leaf-dark border border-leaf/30 transition-all hover:bg-leaf hover:text-white"
            >
              {t("home.scanNow")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

