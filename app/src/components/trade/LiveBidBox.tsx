// The buyer's live bidding panel (SPEC.md §4.11, §5.1 "LiveBidBox ...
// Subscribes to realtime bids; place-bid form"). Highest bid + recent bids
// come from services/bids.ts (useLotBids + useLotBidsRealtime); placing a
// bid goes through the same file's usePlaceBid(), which calls the
// place_bid RPC. Recent bids show price + time only, never a rival buyer's
// business name (decided with the user for 3.3: buyer_kyc stays
// select-own + admin-only; the farmer sees buyer identity in 3.5's BidRow,
// where it drives a decision).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { grossPaise, formatRupees, toPaise } from "@shared/money.ts";
import { isBelowFloor } from "@shared/floor.ts";
import type { BidTargetType } from "@shared/schemas/bid.ts";
import FloorWarning from "@/components/market/FloorWarning";
import RequireOnline from "@/components/common/RequireOnline";
import { useLotBids, useLotBidsRealtime, usePlaceBid, highestBid } from "@/services/bids";
import { formatAgo } from "@/lib/dataAge";

type Props = {
  targetType: BidTargetType;
  targetId: string;
  /** For the "Total" line under the bid input (SPEC.md §4.11). */
  quantityKg: number;
  /** null = no reference floor known yet - never show a warning. */
  floorPaise: number | null;
  /** false = not a verified buyer - the form is disabled with a KYC prompt. */
  canBid: boolean;
};

const RECENT_BIDS_SHOWN = 5;

export default function LiveBidBox({ targetType, targetId, quantityKg, floorPaise, canBid }: Props) {
  const { t, i18n } = useTranslation();
  const { data: bids } = useLotBids(targetType, targetId);
  useLotBidsRealtime(targetType, targetId);
  const placeBid = usePlaceBid();
  const [rupees, setRupees] = useState("");

  const top = highestBid(bids ?? []);
  const rupeesValue = Number(rupees);
  const pricePaise = rupees !== "" && rupeesValue > 0 ? toPaise(rupeesValue) : null;
  const totalPaise = pricePaise !== null ? grossPaise(pricePaise, quantityKg) : null;
  const wouldBeBelowFloor = pricePaise !== null && isBelowFloor(pricePaise, floorPaise);

  async function handlePlaceBid() {
    if (pricePaise === null) return;
    await placeBid.mutateAsync({ targetType, targetId, pricePerQuintalPaise: pricePaise });
    setRupees("");
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border-2 border-line bg-surface p-6 shadow-premium">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-meta font-semibold text-ink-muted">{t("bid.highest")}</p>
          <p className="font-display text-2xl font-black text-ink tabular-nums">
            {top ? formatRupees(top.pricePerQuintalPaise) : t("bid.none")}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pass/40 bg-pass-light px-3 py-1 font-display text-xs font-bold text-pass-text">
          <span className="h-2 w-2 rounded-full bg-pass" aria-hidden="true" />
          {t("bid.live")}
        </span>
      </div>

      {floorPaise !== null && (
        <p className="text-meta text-ink-muted">{t("bid.referenceFloor", { floor: formatRupees(floorPaise) })}</p>
      )}

      {canBid ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-meta font-bold text-ink">{t("bid.yourBid")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
              className="h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold text-ink focus:border-leaf focus:outline-none"
            />
          </label>

          {totalPaise !== null && (
            <p className="text-meta font-semibold text-ink-muted">
              {t("bid.total", { total: formatRupees(totalPaise) })}
            </p>
          )}

          {wouldBeBelowFloor && floorPaise !== null && <FloorWarning floorPaise={floorPaise} />}

          {placeBid.isError && (
            <p className="text-center text-meta font-semibold text-mirchi-text">
              {t(placeBid.error.messageKey)}
            </p>
          )}

          <RequireOnline reasonKey="bid.offlineReason">
            <button
              type="button"
              disabled={pricePaise === null || placeBid.isPending}
              onClick={() => void handlePlaceBid()}
              className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
            >
              {t("bid.place")}
            </button>
          </RequireOnline>
        </div>
      ) : (
        <p className="rounded-2xl border-2 border-haldi/40 bg-haldi-light p-4 text-center font-display text-meta font-bold text-haldi-text">
          {t("kyc.buyerHomeBanner")}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t-2 border-line-subtle pt-4">
        <p className="font-display text-meta font-bold text-ink">{t("bid.recent")}</p>
        {(bids ?? []).length === 0 ? (
          <p className="text-meta text-ink-muted">{t("bid.none")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(bids ?? []).slice(0, RECENT_BIDS_SHOWN).map((bid) => (
              <li key={bid.id} className="flex items-center justify-between gap-2 text-meta">
                <span className="font-display font-bold text-ink tabular-nums">
                  {formatRupees(bid.pricePerQuintalPaise)}
                </span>
                <span className="text-ink-muted">{formatAgo(bid.createdAt, i18n.language)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
