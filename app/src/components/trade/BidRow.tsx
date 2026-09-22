// One offer on the farmer's own lot (SPEC.md §4.12, §5.1 "BidRow ... Farmer
// side row with big buttons", §9.2 Phase 3 "3.5"). Accept navigates to the
// consent route - it does not transact; accept_bid itself is 3.6's job.
// Reject calls services/bids.ts's useRejectBid() directly (bids_reject_own_lot
// RLS policy). Floor warning reuses the exact @shared/floor.ts call and the
// same FloorWarning component the buyer's LiveBidBox uses, so both sides
// warn on the same number.
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Check, X } from "lucide-react";
import { grossPaise, formatRupees } from "@shared/money.ts";
import { isBelowFloor } from "@shared/floor.ts";
import FloorWarning from "@/components/market/FloorWarning";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import VoiceButton from "@/components/voice/VoiceButton";
import { useOnline } from "@/offline/network";
import type { FarmerBidView } from "@/services/bids";

type Props = {
  lotId: string;
  bid: FarmerBidView;
  quantityKg: number;
  floorPaise: number | null;
  onReject: (bidId: string) => void;
  isRejecting: boolean;
};

export default function BidRow({ lotId, bid, quantityKg, floorPaise, onReject, isRejecting }: Props) {
  const { t } = useTranslation();
  const online = useOnline();
  const youGet = grossPaise(bid.pricePerQuintalPaise, quantityKg);
  const belowFloor = isBelowFloor(bid.pricePerQuintalPaise, floorPaise);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold text-ink">{bid.buyerName}</span>
        <VerifiedBadge verified={bid.buyerVerified} />
      </div>

      <div>
        <p className="font-display text-2xl font-black text-ink tabular-nums">
          {formatRupees(bid.pricePerQuintalPaise)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-meta font-semibold text-ink-muted tabular-nums">
            {t("bids.youGet", { amount: formatRupees(youGet) })}
          </p>
          <VoiceButton textKey="bids.youGet" values={{ amount: formatRupees(youGet) }} className="h-8 w-8 shadow-xs" />
        </div>
      </div>

      {belowFloor && floorPaise !== null && <FloorWarning floorPaise={floorPaise} />}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {online ? (
            <Link
              to={`/farmer/lots/${lotId}/bids/${bid.id}/consent`}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-leaf font-display text-base font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98]"
            >
              <Check aria-hidden="true" size={20} />
              {t("bids.accept")}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-line font-display text-base font-bold text-ink-muted"
            >
              <Check aria-hidden="true" size={20} />
              {t("bids.accept")}
            </button>
          )}
          <button
            type="button"
            disabled={!online || isRejecting}
            onClick={() => onReject(bid.id)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-mirchi/40 bg-surface font-display text-base font-bold text-mirchi-text transition-all hover:bg-mirchi-light active:scale-[0.98] disabled:opacity-60"
          >
            <X aria-hidden="true" size={20} />
            {t("bids.sayNo")}
          </button>
        </div>
        {!online && <p className="text-center text-meta text-ink-muted">{t("bid.offlineReason")}</p>}
      </div>
    </div>
  );
}
