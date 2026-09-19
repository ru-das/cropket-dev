// Today's headline price for one crop (SPEC.md §4.8 PriceHero) - whichever
// mandi services/prices.ts's pickHeroMandi() chose: best price today for a
// non-perishable crop (onion, potato), the nearest mandi for a highly
// perishable one (tomato) - see that file's comment for why. The screen
// title + back arrow live in PricesPage (same split as ScanResultPage /
// LotDetailPage); this card is just the price itself.
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown, MapPin, Sparkles } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import DataAge from "@/components/common/DataAge";
import DemoDataTag from "@/components/common/DemoDataTag";
import VoiceButton from "@/components/voice/VoiceButton";
import type { HeroMandi } from "@/services/prices";

type Props = {
  hero: HeroMandi;
  updatedAt: Date;
};

export default function PriceHero({ hero, updatedAt }: Props) {
  const { t } = useTranslation();
  const whyKey = hero.reason === "nearest" ? "prices.whyNearest" : "prices.whyBestPrice";
  const change =
    hero.yesterdayModalPricePaise === null
      ? null
      : hero.modalPricePaise - hero.yesterdayModalPricePaise;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-surface p-6 shadow-hero">
      {/* Dual-tone organic ambient light accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-leaf-light/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-haldi-light/60 blur-3xl"
      />

      {/* Organic SVG curvature chart backdrop */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-28 w-full opacity-15"
        preserveAspectRatio="none"
        viewBox="0 0 400 100"
      >
        <defs>
          <linearGradient id="heroPriceCurve" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-leaf)" stopOpacity="0.8" />
            <stop offset="60%" stopColor="var(--color-haldi)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--color-pass)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M0,75 C70,35 150,85 240,40 C320,15 360,50 400,25 L400,100 L0,100 Z"
          fill="url(#heroPriceCurve)"
        />
        <path
          d="M0,75 C70,35 150,85 240,40 C320,15 360,50 400,25"
          fill="none"
          stroke="var(--color-leaf)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <span className="font-display text-sm font-bold text-ink-muted">
            {t("prices.perQuintal")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-5xl font-black tracking-tight text-ink tabular-nums sm:text-6xl">
              {formatRupees(hero.modalPricePaise)}
            </span>
          </div>
        </div>

        {/* Change pill */}
        {change !== null && change !== 0 && (
          <div
            className={`flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 font-display text-sm font-black shadow-xs ${
              change > 0
                ? "border-pass/50 bg-pass-light text-pass-text shadow-glow-leaf"
                : "border-mirchi/50 bg-mirchi-light text-mirchi-text shadow-glow-haldi"
            }`}
          >
            {change > 0 ? (
              <ArrowUp aria-hidden="true" size={16} className="stroke-[3]" />
            ) : (
              <ArrowDown aria-hidden="true" size={16} className="stroke-[3]" />
            )}
            <span className="tabular-nums">{formatRupees(Math.abs(change))}</span>
          </div>
        )}
      </div>

      {/* Location and reasoning badge */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2.5 border-t-2 border-line-subtle pt-4">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-surface-subtle px-3.5 py-2 font-display text-sm font-bold text-ink border border-line shadow-xs">
          <MapPin size={16} className="shrink-0 text-leaf" aria-hidden="true" />
          <span>{t("prices.atMandi", { mandi: hero.mandi.name })}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-leaf-light px-3.5 py-2 font-display text-sm font-bold text-leaf-dark border border-leaf/25 shadow-xs">
          <Sparkles size={16} className="shrink-0" aria-hidden="true" />
          <span>{t(whyKey)}</span>
        </div>
      </div>

      {/* Tags and Voice */}
      <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {hero.isDemo && <DemoDataTag />}
          <DataAge updatedAt={updatedAt} />
        </div>
        <VoiceButton
          textKey="prices.spoken"
          values={{
            price: formatRupees(hero.modalPricePaise),
            mandi: hero.mandi.name,
            why: t(whyKey),
          }}
          label={t("prices.hear")}
          className="h-11 shadow-xs"
        />
      </div>
    </div>
  );
}
