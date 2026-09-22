// Buyer lot detail = live bidding (SPEC.md §4.11, §9.2 Phase 3 "3.3"). Left:
// the same scan photo + grade breakdown a farmer sees on their own lot
// (LotDetailPage), reused as-is - RLS already lets any buyer read a listed
// lot's grade_results/photo through grade_results_select_listed /
// crop_photos_select_listed (20260922150000_lots_marketplace.sql). Right:
// LiveBidBox. The reference floor reuses the same useMarketData(crop) query
// the farmer's own prices screen already runs - the buyer sees the same
// number, not a second formula.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import GradeBreakdown from "@/components/lot/GradeBreakdown";
import LiveBidBox from "@/components/trade/LiveBidBox";
import VoiceButton from "@/components/voice/VoiceButton";
import { useAuth } from "@/app/authContext";
import { useLot, useLotPhoto } from "@/services/lots";
import { useGradeResult } from "@/services/grading";
import { useMarketData } from "@/services/prices";

export default function BuyerLotDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: lot, isLoading } = useLot(id);
  const { data: photoUrl } = useLotPhoto(lot?.gradeResultId);
  const { data: gradeResult } = useGradeResult(lot?.gradeResultId ?? undefined);
  const { data: market } = useMarketData(lot?.crop ?? "onion");

  const canBid = profile?.kyc_status === "verified";

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
            to="/buyer"
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

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
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
                <span className="truncate font-display text-2xl font-black text-ink">{t(`crop.${lot.crop}`)}</span>
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

          {gradeResult && gradeResult.status === "done" && (
            <GradeBreakdown
              sizeLabel={gradeResult.size_label ?? ""}
              colourPct={gradeResult.colour_pct ?? 0}
              damagePct={gradeResult.damage_pct ?? 0}
              confidence={gradeResult.confidence ?? 0}
            />
          )}
        </div>

        <LiveBidBox
          targetType="lot"
          targetId={lot.id}
          quantityKg={lot.quantityKg}
          floorPaise={market?.floorPaise ?? null}
          canBid={canBid}
        />
      </div>
    </div>
  );
}
