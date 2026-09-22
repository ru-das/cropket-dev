// Lot detail (SPEC.md §4.7 right panel): photo, grade, weight, status and
// the QR code, whether the lot is already on the server or still sitting in
// the outbox (useLot() gives one LotView shape either way - services/lots.ts).
// "Where do you keep the most?" (2.5) links to the Net-₹ comparator. M3's
// "Sell on Cropket" button (services/lots.ts listLot()) lives here now -
// online-only, same disabled-with-a-reason pattern as KycPage's submit.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Clock, ShoppingCart } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import QRLabel from "@/components/lot/QRLabel";
import VoiceButton from "@/components/voice/VoiceButton";
import { useLot, useLotPhoto, useListLot } from "@/services/lots";
import { useOnline } from "@/offline/network";
import { toAppError, type AppError } from "@/lib/errors";

export default function LotDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: lot, isLoading } = useLot(id);
  const { data: photoUrl } = useLotPhoto(lot?.gradeResultId);
  const online = useOnline();
  const listLot = useListLot();
  const [sellError, setSellError] = useState<AppError | null>(null);

  async function handleSell() {
    if (!id) return;
    setSellError(null);
    try {
      await listLot.mutateAsync(id);
    } catch (err) {
      setSellError(toAppError(err));
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

