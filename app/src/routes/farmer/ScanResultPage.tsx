// Grade result screen (SPEC.md §4.6). ScanPage lands here right after
// saveScanPhotos() returns the draft id - that id doubles as the
// grade_results row's id (SPEC.md §5.6). Photos upload and the grade
// request both run from the outbox, not this screen, so useGradeResult()
// polls until the grade function (1.3) + AI service (1.4) have answered.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import GradeBreakdown from "@/components/lot/GradeBreakdown";
import { colourLabelFor, gradeView, isDoneGrade, normalizeSizeLabel } from "@/components/lot/gradeDisplay";
import DemoDataTag from "@/components/common/DemoDataTag";
import VoiceButton from "@/components/voice/VoiceButton";
import { useOnline } from "@/offline/network";
import { useGradeResult, retryGrade } from "@/services/grading";
import type { Grade } from "@shared/schemas/grade.ts";

export default function ScanResultPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const online = useOnline();
  const { data, isLoading } = useGradeResult(id);
  const view = gradeView(data, isLoading, online);
  // The AI service only grades onion today (ai-service/app/main.py CROP_NOT_SUPPORTED).
  // A "failed" tomato/potato scan would otherwise retry forever with no way
  // forward - offer to save it ungraded instead, same as the waiting states do.
  const notGradeable = data?.crop !== undefined && data.crop !== "onion";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-xs active:scale-90 transition-all"
          >
            <ArrowLeft aria-hidden="true" size={20} className="text-ink" />
          </Link>
          <h1 className="text-title font-display font-bold text-ink">{t("grade.title")}</h1>
        </div>
        <VoiceButton textKey="grade.title" />
      </div>

      <div className="flex flex-col items-center gap-4">
        {view === "loading" && <p className="text-body text-ink-muted">{t("common.loading")}</p>}

        {(view === "waiting" || view === "waitingOffline") && (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
            <div className="flex items-center gap-2 text-pass-text">
              <Check aria-hidden="true" size={24} />
              <p className="text-card font-display font-semibold">
                {view === "waiting" ? t("scan.saved") : t("scan.savedOffline")}
              </p>
            </div>
            <p className="text-body text-ink-muted">⏳ {t("scan.gradeNext")}</p>
            <Link
              to={id ? `/farmer/lots/new?grade=${id}` : "#"}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs active:scale-[0.98] transition-all"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </div>
        )}

        {view === "failed" && (
          <div className="flex w-full flex-col gap-3">
            <p className="w-full rounded-2xl border border-mirchi/30 bg-mirchi-light p-4 text-body font-medium text-mirchi-text shadow-card">
              {t(notGradeable ? "grade.notGradeable" : "grade.failed")}
            </p>
            {notGradeable ? (
              <Link
                to={id ? `/farmer/lots/new?grade=${id}` : "#"}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs active:scale-[0.98] transition-all"
              >
                ✅ {t("grade.createLot")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => id && void retryGrade(id)}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs active:scale-[0.98] transition-all"
              >
                {t("grade.tryAgain")}
              </button>
            )}
          </div>
        )}

        {view === "done" && data && isDoneGrade(data) && (
          <div className="flex w-full flex-col items-center gap-4">
            <div className="animate-fade-slide-in flex w-full flex-col items-center gap-2">
              <GradeBadge grade={data.grade as Grade} kind={data.kind === "assured" ? "assured" : "indicative"} />
            </div>
            {data.needs_human_check && (
              <p className="text-meta font-semibold text-haldi-text">{t("grade.needsHumanCheck")}</p>
            )}
            {data.source === "mock" && <DemoDataTag />}
            {data.needs_human_check && (
              <p className="w-full rounded-2xl border border-haldi/40 bg-haldi-light p-4 text-body font-medium text-haldi-text shadow-card">
                {t("grade.lowConfidence")}
              </p>
            )}
            <GradeBreakdown
              sizeLabel={data.size_label}
              colourPct={data.colour_pct}
              damagePct={data.damage_pct}
              confidence={data.confidence}
            />
            <VoiceButton
              textKey="grade.spoken"
              values={{
                grade: data.grade,
                confidence: Math.round(data.confidence),
                size: t(`grade.sizeLabel.${normalizeSizeLabel(data.size_label)}`),
                colour: t(`grade.colourLabel.${colourLabelFor(data.colour_pct)}`),
                damage: Math.round(data.damage_pct),
              }}
              label={t("grade.hear")}
            />
            <Link
              to={`/farmer/lots/new?grade=${id}`}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs active:scale-[0.98] transition-all"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </div>
        )}

        {view !== "loading" && (
          <Link
            to="/farmer/scan"
            className="flex h-12 items-center justify-center rounded-xl text-body font-semibold text-ink-muted hover:text-ink active:scale-95 transition-all"
          >
            {t("scan.scanAgain")}
          </Link>
        )}
      </div>
    </div>
  );
}
