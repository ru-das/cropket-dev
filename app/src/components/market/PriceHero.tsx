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
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {t("prices.perQuintal")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl font-black tracking-tight text-ink tabular-nums sm:text-5xl">
              {formatRupees(hero.modalPricePaise)}
            </span>
          </div>
        </div>

        {/* Change pill */}
        {change !== null && change !== 0 && (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              change > 0
                ? "border border-pass/30 bg-pass-light text-pass-dark"
                : "border border-mirchi/30 bg-mirchi-light text-mirchi-dark"
            }`}
          >
            {change > 0 ? (
              <ArrowUp aria-hidden="true" size={14} className="stroke-[3]" />
            ) : (
              <ArrowDown aria-hidden="true" size={14} className="stroke-[3]" />
            )}
            <span className="tabular-nums">{formatRupees(Math.abs(change))}</span>
          </div>
        )}
      </div>

      {/* Location and reasoning badge */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink">
          <MapPin size={13} className="shrink-0 text-leaf" aria-hidden="true" />
          <span>{t("prices.atMandi", { mandi: hero.mandi.name })}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-light px-2.5 py-1 text-xs font-medium text-leaf-dark">
          <Sparkles size={13} className="shrink-0" aria-hidden="true" />
          <span>{t(whyKey)}</span>
        </div>
      </div>

      {/* Tags and Voice */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
        />
      </div>
    </div>
  );
}
