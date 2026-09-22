// Deal consent screen (SPEC.md §4.13, §5.1 VoiceConsent, §9.2 Phase 3
// "3.6"). Replaces the placeholder BidRow's "Accept" used to navigate to.
// Reads the bid from useMyLotBids() (no new query - the same list BidsPage
// already shows) rather than a fresh lookup, so a bid another tab just
// rejected or accepted shows "no longer available" instead of a broken
// screen. On "I agree": upload the recorded clip, call accept_bid, then
// back to the lot detail page (decided with the user - no new deal route
// yet, that's 4.3/4.4's job).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, IndianRupee, Scale, Tag, Truck, Clock3 } from "lucide-react";
import { formatRupees, grossPaise } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";
import VoiceConsent from "@/components/voice/VoiceConsent";
import { useAuth } from "@/app/authContext";
import { useLot } from "@/services/lots";
import { useMyLotBids } from "@/services/bids";
import { useAcceptBid, consentAudioPath, uploadConsentAudio } from "@/services/deals";
import { useOnline } from "@/offline/network";
import { toAppError, type AppError } from "@/lib/errors";

function pickupDateLabel(lang: string): string {
  const pickup = new Date();
  pickup.setDate(pickup.getDate() + 2);
  return new Intl.DateTimeFormat(lang, {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(pickup);
}

export default function ConsentPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { id: lotId, bidId } = useParams<{ id: string; bidId: string }>();
  const { data: lot, isLoading: lotLoading } = useLot(lotId);
  const { data: bids, isLoading: bidsLoading } = useMyLotBids(lotId);
  const online = useOnline();
  const acceptBid = useAcceptBid(lotId ?? "");

  const [clip, setClip] = useState<Blob | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [uploading, setUploading] = useState(false);

  const bid = bids?.find((b) => b.id === bidId);
  const phrase = t("consent.phrase");

  async function handleAgree() {
    const userId = session?.user.id;
    if (!lotId || !bidId || !clip || !userId) return;
    setError(null);
    setUploading(true);
    try {
      const path = consentAudioPath(userId, bidId);
      await uploadConsentAudio(path, clip);
      await acceptBid.mutateAsync({ bidId, consentAudioPath: path });
      navigate(`/farmer/lots/${lotId}`, { replace: true });
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setUploading(false);
    }
  }

  if (lotLoading || bidsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body text-ink-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!lot || !bid) {
    return (
      <div className="space-y-4">
        <Link
          to={lotId ? `/farmer/lots/${lotId}/bids` : "/farmer/lots"}
          aria-label={t("onboarding.back")}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
          <p className="text-body text-ink-muted">{t("consent.offerGone")}</p>
        </div>
      </div>
    );
  }

  const total = grossPaise(bid.pricePerQuintalPaise, lot.quantityKg);
  const busy = uploading || acceptBid.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to={`/farmer/lots/${lot.id}/bids`}
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface text-ink shadow-xs transition-transform hover:border-leaf active:scale-90"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">
            {t("bids.consentTitle")}
          </h1>
        </div>
        <VoiceButton textKey="bids.consentTitle" className="h-11 w-11 shadow-xs" />
      </div>

      {/* SPEC §4.13's 5-point summary */}
      <div className="divide-y divide-line/60 rounded-3xl border-2 border-line bg-surface shadow-card">
        <ConsentRow icon={<IndianRupee size={20} aria-hidden="true" />} labelKey="consent.price">
          <span className="tabular-nums">{formatRupees(bid.pricePerQuintalPaise)}</span>
        </ConsentRow>
        <ConsentRow icon={<Scale size={20} aria-hidden="true" />} labelKey="consent.quantity">
          <span className="tabular-nums">{`${lot.quantityKg} ${t("lots.kg")}`}</span>
        </ConsentRow>
        {lot.grade && (
          <ConsentRow icon={<Tag size={20} aria-hidden="true" />} labelKey="consent.grade">
            {t("grade.badge", { grade: lot.grade })}
          </ConsentRow>
        )}
        <ConsentRow icon={<Truck size={20} aria-hidden="true" />} labelKey="consent.pickup">
          {pickupDateLabel(i18n.language)}
        </ConsentRow>
        <ConsentRow icon={<Clock3 size={20} aria-hidden="true" />} labelKey="consent.payment">
          {t("consent.paymentValue")}
        </ConsentRow>
      </div>

      <p className="text-center font-display text-lg font-bold tabular-nums text-ink">
        {t("bids.youGet", { amount: formatRupees(total) })}
      </p>

      <VoiceConsent phrase={phrase} onRecorded={setClip} />

      {error && (
        <p className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 text-center font-display text-meta font-bold text-mirchi-text">
          {t(error.messageKey)}
        </p>
      )}

      <button
        type="button"
        disabled={!clip || !online || busy}
        onClick={() => void handleAgree()}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-leaf font-display text-base font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
      >
        {t("consent.agree")}
      </button>
      {!online && <p className="text-center text-meta text-ink-muted">{t("bid.offlineReason")}</p>}
    </div>
  );
}

function ConsentRow({
  icon,
  labelKey,
  children,
}: {
  icon: React.ReactNode;
  labelKey: ParseKeys;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-surface-subtle text-ink-muted">
        {icon}
      </span>
      <span className="flex-1 font-body text-base font-semibold text-ink-muted">{t(labelKey)}</span>
      <span className="font-display text-lg font-bold text-ink">{children}</span>
    </div>
  );
}
