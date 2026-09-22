// Buyer mega lot detail = live bidding on a bundle (SPEC.md §4.11, §9.2
// Phase 3 "3.4"). Mirrors BuyerLotDetailPage's shape (header, floor, the
// same LiveBidBox) but there's no single scan photo or grade breakdown -
// instead a member-lot list (kg + grade only, never a farmer's name or
// business - same call 3.3 made for a rival bidder's identity) and a photo
// strip built from useListedLotPhotos() over every member's
// grade_result_id, the same batched-signing call BuyerHome already uses.
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import LiveBidBox from "@/components/trade/LiveBidBox";
import VoiceButton from "@/components/voice/VoiceButton";
import { useAuth } from "@/app/authContext";
import { useListedLotPhotos } from "@/services/lots";
import { useMegaLot, useMegaLotItems } from "@/services/megaLots";
import { useMarketData } from "@/services/prices";

export default function BuyerMegaLotDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: megaLot, isLoading } = useMegaLot(id);
  const { data: items } = useMegaLotItems(id);
  const { data: market } = useMarketData(megaLot?.crop ?? "onion");

  const gradeResultIds = useMemo(
    () => (items ?? []).map((item) => item.gradeResultId).filter((gid): gid is string => gid !== null),
    [items],
  );
  const { data: photos } = useListedLotPhotos(gradeResultIds);

  const canBid = profile?.kyc_status === "verified";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body text-ink-muted">{t("common.loading")}</p>
      </div>
    );
  }
  if (!megaLot) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
        <p className="text-body text-ink-muted">{t("mega.notFound")}</p>
      </div>
    );
  }

  const farmerCount = megaLot.farmerCount ?? 0;

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
            {t("mega.title", { crop: t(`crop.${megaLot.crop}`), count: farmerCount })}
          </h1>
        </div>
        <VoiceButton
          textKey="mega.title"
          values={{ crop: t(`crop.${megaLot.crop}`), count: farmerCount }}
          className="h-11 w-11 shadow-xs"
        />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-premium">
            <div className="flex items-center gap-4">
              <div className="flex h-22 w-22 shrink-0 items-center justify-center rounded-2xl border-2 border-leaf/20 bg-leaf-light text-3xl shadow-glow-leaf">
                <span aria-hidden="true">
                  {megaLot.crop === "onion" ? "🧅" : megaLot.crop === "tomato" ? "🍅" : "🥔"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="truncate font-display text-2xl font-black text-ink">
                  {t(`crop.${megaLot.crop}`)}
                </span>
                <p className="mt-1 font-display text-lg font-bold text-ink-muted">
                  {megaLot.quantityKg} {t("lots.kg")}
                </p>
                <p className="mt-1 text-meta font-semibold text-ink-muted">
                  {t("mega.farmers", { count: farmerCount })}
                </p>
                <div className="mt-2.5">
                  <GradeBadge grade={megaLot.grade} kind="indicative" size="sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
            <p className="mb-3 font-display text-meta font-bold text-ink">{t("mega.members")}</p>
            <ul className="divide-y divide-line/60">
              {(items ?? []).map((item) => (
                <li key={item.lotId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {item.gradeResultId && photos?.[item.gradeResultId] ? (
                    <img
                      src={photos[item.gradeResultId]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-line object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-leaf/20 bg-leaf-light text-xl">
                      <span aria-hidden="true">
                        {megaLot.crop === "onion" ? "🧅" : megaLot.crop === "tomato" ? "🍅" : "🥔"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-display text-base font-bold text-ink tabular-nums">
                      {t("mega.memberLot", { kg: item.quantityKg })}
                    </p>
                  </div>
                  {item.grade && <GradeBadge grade={item.grade} kind="indicative" size="sm" />}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LiveBidBox
          targetType="mega_lot"
          targetId={megaLot.id}
          quantityKg={megaLot.quantityKg}
          floorPaise={market?.floorPaise ?? null}
          canBid={canBid}
        />
      </div>
    </div>
  );
}
