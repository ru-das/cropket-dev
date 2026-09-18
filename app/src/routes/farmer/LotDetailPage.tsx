// Lot detail (SPEC.md §4.7 right panel): photo, grade, weight, status and
// the QR code, whether the lot is already on the server or still sitting in
// the outbox (useLot() gives one LotView shape either way - services/lots.ts).
// "Where do you keep the most?" (2.5) links to the Net-₹ comparator. No
// "Sell on Cropket" button yet - that needs M3's marketplace, so it's left
// out rather than shown as a dead button (same call 1.5 made for "no Create
// lot button yet").
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Clock } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import QRLabel from "@/components/lot/QRLabel";
import VoiceButton from "@/components/voice/VoiceButton";
import { useLot, useLotPhoto } from "@/services/lots";

export default function LotDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: lot, isLoading } = useLot(id);
  const { data: photoUrl } = useLotPhoto(lot?.gradeResultId);

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
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/lots"
            aria-label={t("onboarding.back")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-xs transition-transform active:scale-95"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {t("lots.detailTitle", { code: lot.qrCode })}
          </h1>
        </div>
        <VoiceButton textKey="lots.detailTitle" values={{ code: lot.qrCode }} />
      </div>

      {/* Sync / pending warning notice */}
      {lot.syncFailed ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-mirchi/30 bg-mirchi-light px-3.5 py-2.5 text-mirchi-text">
          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
          <p className="text-meta font-semibold">{t("lots.notSaved")}</p>
        </div>
      ) : (
        lot.pending && (
          <div className="flex items-center gap-2.5 rounded-xl border border-kesar/30 bg-kesar-light px-3.5 py-2.5 text-kesar-text">
            <Clock size={18} className="shrink-0" aria-hidden="true" />
            <p className="text-meta font-semibold">{t("lots.onPhoneOnly")}</p>
          </div>
        )
      )}

      {/* Lot summary card */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover shadow-xs"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line-subtle bg-leaf-light text-2xl">
              <span aria-hidden="true">{lot.crop === "onion" ? "🧅" : lot.crop === "tomato" ? "🍅" : "🥔"}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-display text-xl font-bold text-ink">
                {t(`crop.${lot.crop}`)}
              </span>
              <span className="rounded-full border border-line-subtle bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                {t(`lots.status.${lot.status}`)}
              </span>
            </div>
            <p className="mt-0.5 text-body font-semibold text-ink-muted">
              {lot.quantityKg} {t("lots.kg")}
            </p>
            {lot.grade && (
              <div className="mt-2">
                <GradeBadge grade={lot.grade} kind="indicative" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR crate code card */}
      <div className="pt-2">
        <QRLabel lotId={lot.id} code={lot.qrCode} />
      </div>

      {/* Action link: Compare Net-₹ */}
      <Link
        to={`/farmer/lots/${lot.id}/compare`}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-leaf text-body font-bold text-white shadow-card transition-all hover:bg-leaf-dark active:scale-97"
      >
        <span>{t("compare.title")}</span>
        <ArrowRight aria-hidden="true" size={20} />
      </Link>
    </div>
  );
}
