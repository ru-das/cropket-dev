// One card in the buyer marketplace grid (SPEC.md §4.10, §5.1 "LotCard ...
// buyer view"). Unlike the farmer's text-only LotCard, this one shows the
// real scan photo - BuyerHome signs every card's photo in one batched call
// (services/lots.ts useListedLotPhotos()), so this component just renders
// whatever URL it's handed. A Link to the lot detail page (3.3's
// LiveBidBox) - bidding is what makes a card worth tapping into.
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import GradeBadge from "@/components/lot/GradeBadge";
import type { MarketLotWithDistance } from "@/routes/buyer/marketplace";

export default function BuyerLotCard({ lot, photoUrl }: { lot: MarketLotWithDistance; photoUrl: string | undefined }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/buyer/lots/${lot.id}`}
      className="flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface p-4 shadow-card transition-all hover:border-leaf active:scale-[0.98]"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="h-32 w-full rounded-xl border border-line object-cover"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded-xl border border-leaf/20 bg-leaf-light text-4xl">
          <span aria-hidden="true">{lot.crop === "onion" ? "🧅" : lot.crop === "tomato" ? "🍅" : "🥔"}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-black text-ink">{t(`crop.${lot.crop}`)}</span>
        <GradeBadge grade={lot.grade} kind="indicative" size="sm" />
      </div>

      <div className="flex items-center justify-between gap-2 text-meta font-semibold text-ink-muted">
        <span className="tabular-nums">
          {lot.quantityKg} {t("lots.kg")}
        </span>
        <span className="tabular-nums">
          {lot.km === null ? t("market.noLocation") : t("market.approxDistance", { km: Math.round(lot.km) })}
        </span>
      </div>
    </Link>
  );
}
