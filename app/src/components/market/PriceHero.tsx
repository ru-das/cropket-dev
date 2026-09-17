// Today's headline price for one crop (SPEC.md §4.8 PriceHero) - whichever
// mandi services/prices.ts's pickHeroMandi() chose: best price today for a
// non-perishable crop (onion, potato), the nearest mandi for a highly
// perishable one (tomato) - see that file's comment for why. The screen
// title + back arrow live in PricesPage (same split as ScanResultPage /
// LotDetailPage); this card is just the price itself.
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown } from "lucide-react";
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
    <div className="flex flex-col gap-1 rounded-card border border-line bg-surface p-4">
      <p className="text-hero font-display text-ink">
        {formatRupees(hero.modalPricePaise)}{" "}
        <span className="text-body font-normal text-ink-muted">{t("prices.perQuintal")}</span>
      </p>

      {change !== null && change !== 0 && (
        <p
          className={`flex items-center gap-1 text-body ${change > 0 ? "text-pass-text" : "text-mirchi-text"}`}
        >
          {change > 0 ? (
            <ArrowUp aria-hidden="true" size={18} />
          ) : (
            <ArrowDown aria-hidden="true" size={18} />
          )}
          {formatRupees(Math.abs(change))}
        </p>
      )}

      <p className="text-meta text-ink-muted">
        {t("prices.atMandi", { mandi: hero.mandi.name })} · {t(whyKey)}
      </p>

      {hero.isDemo && <DemoDataTag />}
      <DataAge updatedAt={updatedAt} />

      <VoiceButton
        textKey="prices.spoken"
        values={{
          price: formatRupees(hero.modalPricePaise),
          mandi: hero.mandi.name,
          why: t(whyKey),
        }}
        label={t("prices.hear")}
        className="mt-1"
      />
    </div>
  );
}
