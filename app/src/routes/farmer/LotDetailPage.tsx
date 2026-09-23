// Lot detail (SPEC.md §4.7 right panel): photo, grade, weight, status and
// the QR code, whether the lot is already on the server or still sitting in
// the outbox (useLot() gives one LotView shape either way - services/lots.ts).
// "Where do you keep the most?" (2.5) links to the Net-₹ comparator. M3's
// "Sell on Cropket" button (services/lots.ts listLot()) lives here now -
// online-only, same disabled-with-a-reason pattern as KycPage's submit.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Clock, ShoppingCart, Gavel, Truck } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import GradeBadge from "@/components/lot/GradeBadge";
import QRLabel from "@/components/lot/QRLabel";
import VoiceButton from "@/components/voice/VoiceButton";
import RequireOnline from "@/components/common/RequireOnline";
import DriverLinkCard from "@/components/logistics/DriverLinkCard";
import Countdown from "@/components/money/Countdown";
import { useLot, useLotPhoto, useListLot } from "@/services/lots";
import { useLotBids, useLotBidsRealtime, useMyLotBids, highestBid } from "@/services/bids";
import { useMegaLotForLot } from "@/services/megaLots";
import { useDealForLot } from "@/services/deals";
import { useMarkDispatched } from "@/services/escrow";
import { useOnline } from "@/offline/network";
import { toAppError, type AppError } from "@/lib/errors";

function pickupDateLabel(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T00:00:00`));
}

export default function LotDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: lot, isLoading } = useLot(id);
  const { data: photoUrl } = useLotPhoto(lot?.gradeResultId);
  const online = useOnline();
  const listLot = useListLot();
  const [sellError, setSellError] = useState<AppError | null>(null);
  const markDispatched = useMarkDispatched(id ?? "");
  const [dispatchError, setDispatchError] = useState<AppError | null>(null);
  // Mega lots: read-only for the member farmer (decided with the user for
  // 3.5 - SPEC §5.3 gives accept to the FPO, which doesn't exist in the
  // seed yet; see 3.4's handoff note "next / known gaps"). Only fetched
  // once the lot is actually bundled, so a plain listed lot never pays for
  // this lookup.
  const { data: megaLotId } = useMegaLotForLot(lot?.status === "in_mega" ? lot.id : undefined);
  const { data: megaBids } = useLotBids("mega_lot", megaLotId ?? undefined);
  useLotBidsRealtime("mega_lot", megaLotId ?? undefined);
  const megaTopBid = highestBid(megaBids ?? []);
  const { data: myBids } = useMyLotBids(lot?.status === "listed" ? lot.id : undefined);
  useLotBidsRealtime("lot", lot?.status === "listed" ? lot.id : undefined);
  const { data: deal } = useDealForLot(lot?.status === "sold" ? lot.id : undefined);

  async function handleSell() {
    if (!id) return;
    setSellError(null);
    try {
      await listLot.mutateAsync(id);
    } catch (err) {
      setSellError(toAppError(err));
    }
  }

  async function handleMarkDispatched(escrowId: string) {
    setDispatchError(null);
    try {
      await markDispatched.mutateAsync({ escrowId });
    } catch (err) {
      setDispatchError(toAppError(err));
    }
  }

  if (isLoading) {
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

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to="/farmer/lots"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-display text-3xl font-black tracking-tight text-ink">
            {t("lots.detailTitle", { code: lot.qrCode })}
          </h1>
        </div>
        <VoiceButton textKey="lots.detailTitle" values={{ code: lot.qrCode }} className="h-11 w-11 shadow-xs" />
      </div>

      {/* Sync / pending warning notice */}
      {lot.syncFailed ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 text-mirchi-text">
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <p className="font-display text-meta font-bold">{t("lots.notSaved")}</p>
        </div>
      ) : (
        lot.pending && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-kesar/40 bg-kesar-light p-4 text-kesar-text">
            <Clock size={20} className="shrink-0" aria-hidden="true" />
            <p className="font-display text-meta font-bold">{t("lots.onPhoneOnly")}</p>
          </div>
        )
      )}

      {/* Two-column on lg+: summary + QR left, actions right */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto] lg:gap-6 lg:items-start">
        {/* Left: lot summary + QR */}
        <div className="flex flex-col gap-5">
          {/* Lot summary card */}
          <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-premium">
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-22 w-22 shrink-0 rounded-2xl border-2 border-line object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-22 w-22 shrink-0 items-center justify-center rounded-2xl border-2 border-leaf/20 bg-leaf-light text-3xl shadow-glow-leaf">
                  <span aria-hidden="true">{lot.crop === "onion" ? "🧅" : lot.crop === "tomato" ? "🍅" : "🥔"}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-2xl font-black text-ink">
                    {t(`crop.${lot.crop}`)}
                  </span>
                  <span className="rounded-full border-2 border-line bg-surface-subtle px-3 py-0.5 font-display text-xs font-bold text-ink-muted">
                    {t(`lots.status.${lot.status}`)}
                  </span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-ink-muted">
                  {lot.quantityKg} {t("lots.kg")}
                </p>
                {lot.grade && (
                  <div className="mt-2.5">
                    <GradeBadge grade={lot.grade} kind="indicative" size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR crate code card */}
          <QRLabel lotId={lot.id} code={lot.qrCode} />
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-3 lg:min-w-[280px]">
          {lot.status === "draft" && !lot.pending && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!lot.grade || !online || listLot.isPending}
                  onClick={() => void handleSell()}
                  className="flex h-16 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
                >
                  <ShoppingCart aria-hidden="true" size={22} />
                  <span>{t("lots.sell")}</span>
                </button>
                <VoiceButton textKey="lots.sell" className="h-11 w-11 shrink-0 shadow-xs" />
              </div>
              {!lot.grade ? (
                <p className="text-center text-meta text-ink-muted">{t("lots.sellNeedsGrade")}</p>
              ) : !online ? (
                <p className="text-center text-meta text-ink-muted">{t("lots.sellNeedsInternet")}</p>
              ) : (
                sellError && (
                  <p className="text-center text-meta font-semibold text-mirchi-text">{t(sellError.messageKey)}</p>
                )
              )}
            </div>
          )}

          {lot.status === "listed" && (
            <Link
              to={`/farmer/lots/${lot.id}/bids`}
              className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98]"
            >
              <Gavel aria-hidden="true" size={22} />
              <span>{t("bids.viewOffers", { count: myBids?.length ?? 0 })}</span>
            </Link>
          )}

          {lot.status === "in_mega" && (
            <div className="rounded-2xl border-2 border-haldi/40 bg-haldi-light p-4 text-center">
              <p className="font-display text-meta font-bold text-haldi-text">{t("bids.inMegaLot")}</p>
              <p className="mt-1 font-display text-lg font-black text-ink tabular-nums">
                {megaTopBid ? t("bids.bestOffer", { price: formatRupees(megaTopBid.pricePerQuintalPaise) }) : t("bid.none")}
              </p>
            </div>
          )}

          {/* Sold (3.6): no buyer name yet - see services/deals.ts DealView
              comment. 4.3 (Cashfree pay screen) is what moves the escrow
              past CREATED - until then this still reads "waiting for buyer
              payment"; once FUNDED it shows the haldi "money locked" card.
              4.4's Khata screen (/farmer/khata) shows the same 🟡 entry in
              the full passbook, reading khata_entries directly rather than
              this deal's escrowState. */}
          {lot.status === "sold" && deal && (
            <>
              <div
                className={
                  deal.escrowState === "CREATED"
                    ? "rounded-2xl border-2 border-pass/40 bg-pass-light/40 p-4 text-center"
                    : deal.escrowState === "IN_TRANSIT"
                      ? "rounded-2xl border-2 border-neel/40 bg-neel-light p-4 text-center"
                      : deal.escrowState === "RELEASED"
                        ? "rounded-2xl border-2 border-pass/40 bg-pass-light p-4 text-center shadow-glow-leaf"
                        : "rounded-2xl border-2 border-haldi/40 bg-haldi-light p-4 text-center shadow-glow-haldi"
                }
              >
                <p
                  className={
                    deal.escrowState === "CREATED"
                      ? "font-display text-meta font-bold text-pass-text"
                      : deal.escrowState === "IN_TRANSIT"
                        ? "font-display text-meta font-bold text-neel-text"
                        : deal.escrowState === "RELEASED"
                          ? "font-display text-meta font-bold text-pass-text"
                          : "font-display text-meta font-bold text-haldi-text"
                  }
                >
                  {t("lots.deal.soldTitle")}
                </p>
                <p className="mt-1 font-display text-2xl font-black text-ink tabular-nums">
                  {formatRupees(deal.totalPaise)}
                </p>
                <p className="mt-1 font-body text-sm font-semibold text-ink-muted">
                  {t("lots.deal.pickupDate", { date: pickupDateLabel(deal.pickupDate, i18n.language) })}
                </p>
                <p className="mt-2 font-body text-sm text-ink-muted">
                  {deal.escrowState === "CREATED"
                    ? t("lots.deal.waitingPayment")
                    : deal.escrowState === "IN_TRANSIT"
                      ? t("lots.deal.onTheWay")
                      : deal.escrowState === "DELIVERED"
                        ? t("lots.deal.delivered")
                        : deal.escrowState === "RELEASED"
                          ? t("lots.deal.received")
                          : t("lots.deal.moneyLocked")}
                </p>
                <VoiceButton
                  textKey={
                    deal.escrowState === "CREATED"
                      ? "lots.deal.waitingPayment"
                      : deal.escrowState === "IN_TRANSIT"
                        ? "lots.deal.onTheWay"
                        : deal.escrowState === "DELIVERED"
                          ? "lots.deal.delivered"
                          : deal.escrowState === "RELEASED"
                            ? "lots.deal.received"
                            : "lots.deal.moneyLocked"
                  }
                  className="mx-auto mt-2 h-9 w-9 shadow-xs"
                />
              </div>

              {/* Countdown (SPEC §5.1, §9.2 Phase 4 "4.9") - the 24h
                  auto-release timer, once the driver's delivery photo
                  moved the escrow to DELIVERED (4.7) and before the OTP
                  (4.8) or the timer (4.9's cron-auto-settle) releases it. */}
              {deal.escrowState === "DELIVERED" && deal.autoReleaseAt && (
                <Countdown until={deal.autoReleaseAt} labelKey="countdown.farmer" />
              )}

              {/* "Mark dispatched" (SPEC §4.15, §5.3, §9.2 Phase 4 "4.6") -
                  the farmer's own simple-dispatch move, only while the
                  escrow is FUNDED. Same RequireOnline pattern as
                  BuyerDealPage's "Pay and lock money" (money/trading
                  actions are online-only, AGENTS.md §4). */}
              {deal.escrowState === "FUNDED" && deal.escrowId && (
                <div className="flex flex-col gap-2">
                  {dispatchError && (
                    <p className="text-center text-meta font-semibold text-mirchi-text">
                      {t(dispatchError.messageKey)}
                    </p>
                  )}
                  <RequireOnline reasonKey="lots.deal.dispatchOffline">
                    <button
                      type="button"
                      disabled={markDispatched.isPending}
                      onClick={() => void handleMarkDispatched(deal.escrowId as string)}
                      className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
                    >
                      <Truck aria-hidden="true" size={22} />
                      <span>{t("lots.deal.markDispatched")}</span>
                    </button>
                  </RequireOnline>
                </div>
              )}

              {/* Driver link (SPEC §4.16, §5.4, §9.2 Phase 4 "4.7") - only
                  once the escrow is IN_TRANSIT (4.6's own move). */}
              {deal.escrowState === "IN_TRANSIT" && <DriverLinkCard dealId={deal.id} />}
            </>
          )}

          <Link
            to={`/farmer/lots/${lot.id}/compare`}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98]"
          >
            <span>{t("compare.title")}</span>
            <ArrowRight aria-hidden="true" size={22} />
          </Link>
        </div>
      </div>
    </div>
  );
}

