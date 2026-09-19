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
  if (lotLoading || !market) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body text-ink-muted">{t("common.loading")}</p>
      </div>
    );
  }
  if (!lot) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
        <p className="text-body text-ink-muted">{t("lots.notFound")}</p>
      </div>
    );
  }

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
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to={`/farmer/lots/${lot.id}`}
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-display text-3xl font-black tracking-tight text-ink">
            {t("compare.title")}
          </h1>
        </div>
        <VoiceButton textKey="compare.title" className="h-11 w-11 shadow-xs" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-xs">
        <p className="font-display text-base font-bold text-ink-muted">{subtitle}</p>
        <DataAge updatedAt={new Date(dataUpdatedAt)} />
      </div>

      {/* Two-column on lg+: left column anchors the info, right column shows mandi cards */}
      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start">
        {/* Left column (lg+): sticky lot context panel */}
        <div className="hidden lg:flex lg:flex-col lg:gap-4">
          <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
            <p className="font-display text-xs font-black uppercase tracking-widest text-leaf-dark mb-3">
              {t("compare.title")}
            </p>
            <p className="font-display text-base font-bold text-ink">{subtitle}</p>
            <DataAge updatedAt={new Date(dataUpdatedAt)} />
          </div>
        </div>

        {/* Main column: empty states + mandi cards */}
        <div>
          {!farmerLocation ? (
            <div className="rounded-3xl border-2 border-line bg-surface p-6 text-center shadow-card">
              <p className="font-display text-base font-bold text-ink-muted">{t("compare.noLocation")}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border-2 border-line bg-surface p-6 text-center shadow-card">
              <p className="font-display text-base font-bold text-ink-muted">{t("compare.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Table column headers */}
              <div className="flex items-center gap-2 px-4 font-display text-xs font-bold uppercase tracking-wider text-ink-muted">
                <span className="flex-1">{t("compare.columnPlace")}</span>
                <span className="w-22 text-right">{t("compare.columnPrice")}</span>
                <span className="w-28 text-right">{t("compare.columnYouKeep")}</span>
              </div>

              {/* Mandi comparison cards */}
              {rows.map((row) => (
                <details
                  key={row.mandi.id}
                  className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
                    row.isBest
                      ? "border-pass/80 bg-surface shadow-hero ring-4 ring-pass/15"
                      : "border-line bg-surface shadow-card hover:border-leaf/40 hover:shadow-premium"
                  }`}
                >
                  {row.isBest && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-pass-light/60 blur-2xl"
                    />
                  )}

                  <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3.5 p-4.5 transition-colors group-open:border-b-2 group-open:border-line-subtle [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      {row.isBest && (
                        <div className="mb-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-pass/40 bg-pass-light px-3 py-0.5 font-display text-xs font-black text-pass-text shadow-xs animate-pulse">
                            <Trophy
                              aria-label={t("compare.bestBadge")}
                              size={14}
                              className="shrink-0 text-pass-text"
                            />
                            <span>{t("compare.bestBadge")}</span>
                          </span>
                        </div>
                      )}
                      <p className="truncate font-display text-lg font-bold text-ink">{row.mandi.name}</p>
                    </div>

                    <div className="w-22 text-right">
                      <span className="font-display text-base font-bold tabular-nums text-ink-muted">
                        {formatRupees(row.pricePerQuintalPaise)}
                      </span>
                    </div>

                    <div className="w-28 text-right">
                      <span
                        className={`font-display text-2xl font-black tabular-nums ${
                          row.isBest ? "text-pass-text" : "text-ink"
                        }`}
                      >
                        {formatRupees(row.youKeepPaise)}
                      </span>
                    </div>
                  </summary>

                  {/* Receipt-style cost deductions */}
                  <div className="space-y-3 bg-gradient-to-b from-surface-subtle/70 to-surface-subtle p-5 font-display text-sm font-medium text-ink-muted">
                    <div className="flex justify-between">
                      <span className="text-ink font-semibold">{t("compare.gross")}</span>
                      <span className="font-bold tabular-nums text-ink">{formatRupees(row.grossPaise)}</span>
                    </div>
                    <div className="flex justify-between text-mirchi-text">
                      <span className="truncate pr-2 font-semibold">
                        {t("compare.transport")}
                        {market.cheapestTransporter && (
                          <span className="text-ink-muted font-normal">
                            {" "}
                            (
                            {t("compare.transportVia", {
                              name: market.cheapestTransporter.name,
                              rate: formatRupees(market.cheapestTransporter.ratePerKmPaise),
                            })}
                            )
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">-{formatRupees(row.transportPaise)}</span>
                    </div>
                    <div className="flex justify-between text-mirchi-text font-semibold">
                      <span>{t("compare.fees")}</span>
                      <span className="font-bold tabular-nums">-{formatRupees(row.feesPaise)}</span>
                    </div>
                    <div className="flex justify-between text-mirchi-text font-semibold">
                      <span>{t("compare.weightLoss")}</span>
                      <span className="font-bold tabular-nums">-{formatRupees(row.lossPaise)}</span>
                    </div>

                    <div className="flex justify-between border-t-2 border-line pt-3.5 font-display text-base font-bold text-ink">
                      <span>{t("compare.columnYouKeep")}</span>
                      <span className="font-display text-2xl font-black tabular-nums text-leaf-dark">
                        {formatRupees(row.youKeepPaise)}
                      </span>
                    </div>

                    {row.isDemo && (
                      <div className="pt-2">
                        <DemoDataTag />
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

