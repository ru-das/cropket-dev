// Farmer's offers screen (SPEC.md §4.12, §9.2 Phase 3 "3.5"). Lists every
// active bid on one of the farmer's own listed lots (lot_bids() RPC via
// services/bids.ts) with the same Realtime channel LiveBidBox subscribes to
// on the buyer side (bids:lot:{id}), so a new bid shows up here live too.
// Accepting is 3.6's job - BidRow's "Accept" only navigates to the consent
// route, it never transacts here.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import VoiceButton from "@/components/voice/VoiceButton";
import BidRow from "@/components/trade/BidRow";
import { useLot } from "@/services/lots";
import { useMyLotBids, useLotBidsRealtime, useRejectBid } from "@/services/bids";
import { useMarketData } from "@/services/prices";
import { toAppError, type AppError } from "@/lib/errors";

export default function BidsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: lot, isLoading } = useLot(id);
  const { data: market } = useMarketData(lot?.crop ?? "onion");
  const { data: bids } = useMyLotBids(id);
  useLotBidsRealtime("lot", id);
  const rejectBid = useRejectBid(id ?? "");
  const [rejectError, setRejectError] = useState<AppError | null>(null);

  async function handleReject(bidId: string) {
    setRejectError(null);
    try {
      await rejectBid.mutateAsync(bidId);
    } catch (err) {
      setRejectError(toAppError(err));
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
            {t("bids.title", { code: lot.qrCode })}
          </h1>
        </div>
        <VoiceButton textKey="bids.title" values={{ code: lot.qrCode }} className="h-11 w-11 shadow-xs" />
      </div>

      {rejectError && (
        <p className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 text-center font-display text-meta font-bold text-mirchi-text">
          {t(rejectError.messageKey)}
        </p>
      )}

      {(bids ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line bg-surface p-8 text-center shadow-card">
          <p className="font-display text-lg font-bold text-ink-muted">{t("bids.none")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(bids ?? []).map((bid) => (
            <BidRow
              key={bid.id}
              lotId={lot.id}
              bid={bid}
              quantityKg={lot.quantityKg}
              floorPaise={market?.floorPaise ?? null}
              onReject={(bidId) => void handleReject(bidId)}
              isRejecting={rejectBid.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
