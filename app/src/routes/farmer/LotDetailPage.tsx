// Lot detail (SPEC.md §4.7 right panel): photo, grade, weight, status and
// the QR code, whether the lot is already on the server or still sitting in
// the outbox (useLot() gives one LotView shape either way - services/lots.ts).
// "Where do you keep the most?" (2.5) links to the Net-₹ comparator. No
// "Sell on Cropket" button yet - that needs M3's marketplace, so it's left
// out rather than shown as a dead button (same call 1.5 made for "no Create
// lot button yet").
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import QRLabel from "@/components/lot/QRLabel";
import VoiceButton from "@/components/voice/VoiceButton";
import { useLot, useLotPhoto } from "@/services/lots";

export default function LotDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: lot, isLoading } = useLot(id);
  const { data: photoUrl } = useLotPhoto(lot?.gradeResultId);

  if (isLoading) return <p className="text-body text-ink-muted">{t("common.loading")}</p>;
  if (!lot) return <p className="text-body text-ink-muted">{t("lots.notFound")}</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to="/farmer/lots"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">
            {t("lots.detailTitle", { code: lot.qrCode })}
          </h1>
        </div>
        <VoiceButton textKey="lots.detailTitle" values={{ code: lot.qrCode }} />
      </div>

      {lot.syncFailed ? (
        <p className="mt-2 text-meta font-semibold text-mirchi-text">{t("lots.notSaved")}</p>
      ) : (
        lot.pending && (
          <p className="mt-2 text-meta font-semibold text-kesar-text">{t("lots.onPhoneOnly")}</p>
        )
      )}

      <div className="mt-4 flex items-center gap-3 rounded-card border border-line-soft bg-surface p-4 shadow-[var(--shadow-soft)]">
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-button border border-line-soft object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-card font-semibold text-ink">
            {t(`crop.${lot.crop}`)} · {lot.quantityKg} {t("lots.kg")}
          </span>
          <span className="text-meta text-ink-muted">{t(`lots.status.${lot.status}`)}</span>
        </div>
      </div>

      {lot.grade && (
        <div className="mt-4">
          <GradeBadge grade={lot.grade} kind="indicative" />
        </div>
      )}

      <div className="mt-6">
        <QRLabel lotId={lot.id} code={lot.qrCode} />
      </div>

      <Link
        to={`/farmer/lots/${lot.id}/compare`}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-button border border-leaf bg-leaf text-body font-semibold text-white shadow-[var(--shadow-soft)]"
      >
        {t("compare.title")}
      </Link>
    </div>
  );
}
