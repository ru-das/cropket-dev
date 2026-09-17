// Net-₹ Comparator (SPEC.md §4.9, §9.2 Phase 2 "2.5 route-distance + Net-₹
// comparator screen") - "Where do you keep the most?" One row per mandi
// with a saved location, sorted by what the farmer actually keeps after
// transport, mandi fees and transit loss. Mandis only for now: no 🏆
// Cropket-buyer row yet, real bids don't exist until 3.3.
//
// Every number here was already built and tested: netRupee() (2.2),
// buildComparisonRows() (2.5, services/prices.ts) just calls it once per
// mandi and ranks the results. Works offline from the saved price/distance
// copies (SPEC.md §3.1 "/farmer/lots/:id/compare ... yes, from saved prices
// and distances").
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";
import DataAge from "@/components/common/DataAge";
import DemoDataTag from "@/components/common/DemoDataTag";
import { useAuth } from "@/app/authContext";
import { useLot } from "@/services/lots";
import { buildComparisonRows, mandisWithCoords, useMarketData } from "@/services/prices";
import { useRouteDistances } from "@/services/routes";

export default function ComparePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: lot, isLoading: lotLoading } = useLot(id);

  const crop = lot?.crop ?? "onion"; // useMarketData needs a crop even before the lot loads
  const { data: market, dataUpdatedAt, isError, refetch } = useMarketData(crop);

  const farmerLocation =
    profile?.lat !== null &&
    profile?.lat !== undefined &&
    profile?.lng !== null &&
    profile?.lng !== undefined
      ? { lat: profile.lat, lng: profile.lng }
      : null;

  const routable = market ? mandisWithCoords(market.mandiPrices) : [];
  const { legs } = useRouteDistances(
    farmerLocation,
    routable.map((m) => ({ lat: m.mandi.lat, lng: m.mandi.lng })),
  );

  if (isError && !market) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-mirchi bg-mirchi/10 p-4">
        <p className="text-body text-mirchi-text">{t("common.loadFailed")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="h-12 rounded-button border border-mirchi-text px-4 text-body font-semibold text-mirchi-text"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }
  if (lotLoading || !market)
    return <p className="text-body text-ink-muted">{t("common.loading")}</p>;
  if (!lot) return <p className="text-body text-ink-muted">{t("lots.notFound")}</p>;

  const rows =
    legs && market.cheapestTransporter
      ? buildComparisonRows({
          mandiPrices: routable,
          legs,
          quantityKg: lot.quantityKg,
          transitLossPct: market.transitLossPct,
          ratePerKmPaise: market.cheapestTransporter.ratePerKmPaise,
        })
      : [];

  const subtitle = lot.grade
    ? t("compare.subtitle", { qty: lot.quantityKg, crop: t(`crop.${lot.crop}`), grade: lot.grade })
    : t("compare.subtitleNoGrade", { qty: lot.quantityKg, crop: t(`crop.${lot.crop}`) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to={`/farmer/lots/${lot.id}`}
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">{t("compare.title")}</h1>
        </div>
        <VoiceButton textKey="compare.title" />
      </div>
      <p className="text-body text-ink-muted">{subtitle}</p>
      <DataAge updatedAt={new Date(dataUpdatedAt)} />

      {!farmerLocation ? (
        <p className="rounded-card border border-line bg-surface p-4 text-body text-ink-muted">
          {t("compare.noLocation")}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-4 text-body text-ink-muted">
          {t("compare.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 text-meta text-ink-muted">
            <span className="flex-1">{t("compare.columnPlace")}</span>
            <span className="w-20 text-right">{t("compare.columnPrice")}</span>
            <span className="w-20 text-right">{t("compare.columnYouKeep")}</span>
          </div>

          {rows.map((row) => (
            <details
              key={row.mandi.id}
              className={
                row.isBest
                  ? "rounded-card border border-pass bg-pass/10"
                  : "rounded-card border border-line bg-surface"
              }
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-3">
                {row.isBest && (
                  <Trophy
                    aria-label={t("compare.bestBadge")}
                    size={18}
                    className="shrink-0 text-pass-text"
                  />
                )}
                <span className="flex-1 text-body text-ink">{row.mandi.name}</span>
                <span className="w-20 text-right text-body text-ink">
                  {formatRupees(row.pricePerQuintalPaise)}
                </span>
                <span
                  className={
                    row.isBest
                      ? "w-20 text-right text-body font-semibold text-pass-text"
                      : "w-20 text-right text-body font-semibold text-ink"
                  }
                >
                  {formatRupees(row.youKeepPaise)}
                </span>
              </summary>
              <div className="flex flex-col gap-1 border-t border-line p-3 text-meta text-ink-muted">
                <div className="flex justify-between">
                  <span>{t("compare.gross")}</span>
                  <span>{formatRupees(row.grossPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {t("compare.transport")}
                    {market.cheapestTransporter && (
                      <>
                        {" "}
                        (
                        {t("compare.transportVia", {
                          name: market.cheapestTransporter.name,
                          rate: formatRupees(market.cheapestTransporter.ratePerKmPaise),
                        })}
                        )
                      </>
                    )}
                  </span>
                  <span>-{formatRupees(row.transportPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("compare.fees")}</span>
                  <span>-{formatRupees(row.feesPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("compare.weightLoss")}</span>
                  <span>-{formatRupees(row.lossPaise)}</span>
                </div>
                {row.isDemo && <DemoDataTag />}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
