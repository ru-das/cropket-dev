// Grade result screen (SPEC.md §4.6). ScanPage lands here right after
// saveScanPhotos() returns the draft id - that id doubles as the
// grade_results row's id (SPEC.md §5.6). Photos upload and the grade
// request both run from the outbox, not this screen, so useGradeResult()
// polls until the grade function (1.3) + AI service (1.4) have answered.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
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
  const notGradeable = data?.crop !== undefined && data.crop !== "onion";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">{t("grade.title")}</h1>
        </div>
        <VoiceButton textKey="grade.title" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-5">
        {view === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 aria-hidden="true" size={32} className="animate-spin text-leaf" />
            <p className="text-body text-ink-muted">{t("common.loading")}</p>
          </div>
        )}

        {(view === "waiting" || view === "waitingOffline") && (
          <>
            <div className="flex items-center gap-2 text-pass-text">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pass/10">
                <Check aria-hidden="true" size={22} />
              </div>
              <p className="text-body font-semibold">
                {view === "waiting" ? t("scan.saved") : t("scan.savedOffline")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-card border border-line-soft bg-surface px-4 py-3 shadow-[var(--shadow-soft)]">
              <Loader2 aria-hidden="true" size={18} className="animate-spin text-ink-muted" />
              <p className="text-body text-ink-muted">{t("scan.gradeNext")}</p>
            </div>
            <Link
              to={id ? `/farmer/lots/new?grade=${id}` : "#"}
              className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white shadow-[var(--shadow-soft)]"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </>
        )}

        {view === "failed" && (
          <>
            <p className="w-full rounded-card border border-mirchi/30 bg-mirchi/5 p-4 text-body text-mirchi-text">
              {t(notGradeable ? "grade.notGradeable" : "grade.failed")}
            </p>
            {notGradeable ? (
              <Link
                to={id ? `/farmer/lots/new?grade=${id}` : "#"}
                className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white shadow-[var(--shadow-soft)]"
              >
                ✅ {t("grade.createLot")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => id && void retryGrade(id)}
                className="h-14 w-full rounded-button bg-leaf px-6 text-body font-semibold text-white shadow-[var(--shadow-soft)]"
              >
                {t("grade.tryAgain")}
              </button>
            )}
          </>
        )}

        {view === "done" && data && isDoneGrade(data) && (
          <>
            <div className="animate-scale-in">
              <GradeBadge grade={data.grade as Grade} kind={data.kind === "assured" ? "assured" : "indicative"} />
            </div>
            {data.needs_human_check && (
              <p className="text-meta font-medium text-haldi-text">{t("grade.needsHumanCheck")}</p>
            )}
            {data.source === "mock" && <DemoDataTag />}
            {data.needs_human_check && (
              <p className="w-full rounded-card border border-haldi/30 bg-haldi/5 p-4 text-body text-haldi-text">
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
              className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white shadow-[var(--shadow-soft)]"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </>
        )}

        {view !== "loading" && (
          <Link
            to="/farmer/scan"
            className="flex h-14 items-center justify-center rounded-button border border-line bg-surface px-6 text-body font-semibold text-ink shadow-[var(--shadow-soft)]"
          >
            {t("scan.scanAgain")}
          </Link>
        )}
      </div>
    </div>
  );
}
