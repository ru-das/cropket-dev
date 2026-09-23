// Buyer's pay screen (SPEC.md §4.14, §9.2 Phase 4 "4.3"). Reads from
// useBuyerDeals() (no separate single-deal lookup - buyer_deals() takes no
// arguments, and the prototype's buyer has only a handful of deals) rather
// than a fresh RPC call, same reasoning ConsentPage reuses useMyLotBids().
// "Pay and lock money" calls escrow-pay (services/escrow.ts), which in
// mock mode funds the escrow itself - a success flips the card to "Money
// locked safely" with no separate webhook step in this demo.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";
import DemoDataTag from "@/components/common/DemoDataTag";
import RequireOnline from "@/components/common/RequireOnline";
import OtpDigits from "@/components/money/OtpDigits";
import Countdown from "@/components/money/Countdown";
import { useBuyerDeals } from "@/services/deals";
import { usePayEscrow, useDeliveryCode } from "@/services/escrow";
import type { Database } from "@/lib/database.types";

// Same gate as delivery-code's own CODE_VISIBLE_STATES (server side) -
// mirrored here so the app doesn't even call the function for a state that
// has no code to show (RELEASED, DISPUTED, ...).
const CODE_VISIBLE_STATES: ReadonlySet<Database["public"]["Enums"]["escrow_state"]> = new Set([
  "FUNDED",
  "DRIVER_ADVANCE_PAID",
  "IN_TRANSIT",
  "DELIVERED",
]);

export default function BuyerDealPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: deals, isLoading } = useBuyerDeals();
  const payEscrow = usePayEscrow();

  const deal = deals?.find((d) => d.dealId === id);
  const showCode = deal !== undefined && CODE_VISIBLE_STATES.has(deal.escrowState);
  const deliveryCode = useDeliveryCode(showCode ? deal.escrowId : undefined);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body text-ink-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
        <p className="text-body text-ink-muted">{t("deal.notFound")}</p>
      </div>
    );
  }

  const locked = deal.escrowState !== "CREATED";
  const released = deal.escrowState === "RELEASED";
  const itemLabel = deal.grade
    ? t("deal.itemLabel", { crop: t(`crop.${deal.crop}`), grade: deal.grade, qty: deal.quantityKg, price: formatRupees(deal.pricePerQuintalPaise) })
    : t("deal.itemLabelNoGrade", { crop: t(`crop.${deal.crop}`), qty: deal.quantityKg, price: formatRupees(deal.pricePerQuintalPaise) });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to="/buyer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">
            {t("deal.payTitle", { code: deal.qrCode })}
          </h1>
        </div>
        <VoiceButton textKey="deal.payTitle" values={{ code: deal.qrCode }} className="h-11 w-11 shadow-xs" />
      </div>

      <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-ink">{itemLabel}</p>
          <p className="shrink-0 font-display text-lg font-bold tabular-nums text-ink">
            {formatRupees(deal.totalPaise)}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-subtle pt-3">
          <p className="text-meta text-ink-muted">{t("deal.feeLabel")}</p>
          <p className="tabular-nums text-meta text-ink-muted">{formatRupees(deal.feePaise)}</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-line pt-3">
          <p className="font-display text-lg font-bold text-ink">{t("deal.totalLabel")}</p>
          <p className="font-display text-xl font-black tabular-nums text-ink">
            {formatRupees(deal.escrowTotalPaise)}
          </p>
        </div>
      </div>

      {released ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-pass/40 bg-pass-light p-5 text-center shadow-glow-leaf">
          <CheckCircle2 aria-hidden="true" size={28} className="text-pass-text" />
          <p className="font-display text-lg font-black text-pass-text">{t("deal.paidTitle")}</p>
          <p className="text-meta text-ink-muted">{t("deal.paidBody")}</p>
          <VoiceButton textKey="deal.paidBody" className="mt-1 h-9 w-9 shadow-xs" />
        </div>
      ) : locked ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-haldi/40 bg-haldi-light p-5 text-center shadow-glow-haldi">
          <ShieldCheck aria-hidden="true" size={28} className="text-haldi-text" />
          <p className="font-display text-lg font-black text-haldi-text">{t("deal.lockedTitle")}</p>
          <p className="text-meta text-ink-muted">{t("deal.lockedBody", { code: deal.qrCode })}</p>
          <VoiceButton
            textKey="deal.lockedBody"
            values={{ code: deal.qrCode }}
            className="mt-1 h-9 w-9 shadow-xs"
          />
        </div>
      ) : null}

      {/* Countdown (SPEC §5.1, §9.2 Phase 4 "4.9") - the 24h auto-release
          timer, once the driver's delivery photo moved the escrow to
          DELIVERED. */}
      {deal.escrowState === "DELIVERED" && deal.autoReleaseAt && (
        <Countdown until={deal.autoReleaseAt} labelKey="countdown.buyer" />
      )}

      {showCode && deliveryCode.data && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-line bg-surface p-5 text-center shadow-card">
          <div className="flex items-center gap-2.5">
            <p className="font-display text-subhead font-bold text-ink">{t("deal.deliveryCodeTitle")}</p>
            <VoiceButton
              textKey="deal.deliveryCodeSpoken"
              values={{ digits: deliveryCode.data.code.split("").join(" ") }}
              className="h-9 w-9 shadow-xs"
            />
          </div>
          <OtpDigits digits={deliveryCode.data.code} />
          <p className="text-meta text-ink-muted">{t("deal.deliveryCodeHint")}</p>
        </div>
      )}
      {/* Same "read that failed" shape KhataPage/PricesPage use (AGENTS.md
       * §5 "Reads that fail") - this isn't a money action, so a retry
       * button is enough, no AppError code needed. */}
      {showCode && deliveryCode.isError && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-mirchi/40 bg-mirchi-light p-4 text-center shadow-card">
          <p className="text-meta font-semibold text-mirchi-text">{t("common.loadFailed")}</p>
          <button
            type="button"
            onClick={() => void deliveryCode.refetch()}
            className="h-10 rounded-xl border border-mirchi-text px-4 text-meta font-bold text-mirchi-text transition-transform active:scale-97"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {!locked && (
        <div className="space-y-3">
          {payEscrow.isError && (
            <p className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 text-center font-display text-meta font-bold text-mirchi-text">
              {t(payEscrow.error.messageKey)}
            </p>
          )}
          <RequireOnline reasonKey="deal.payOffline">
            <button
              type="button"
              disabled={payEscrow.isPending}
              onClick={() => payEscrow.mutate({ escrowId: deal.escrowId })}
              className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
            >
              <Lock aria-hidden="true" size={22} />
              {t("deal.payButton")}
            </button>
          </RequireOnline>
          <div className="flex items-center justify-center gap-2">
            <DemoDataTag />
          </div>
          <p className="text-center text-meta text-ink-muted">{t("deal.reassurance")}</p>
        </div>
      )}
    </div>
  );
}
