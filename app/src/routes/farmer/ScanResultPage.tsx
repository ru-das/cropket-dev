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
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">{t("grade.title")}</h1>
        </div>
        <VoiceButton textKey="grade.title" />
      </div>

      <div className="mt-4 flex flex-col items-center gap-4">
        {view === "loading" && <p className="text-body text-ink-muted">{t("common.loading")}</p>}

        {(view === "waiting" || view === "waitingOffline") && (
          <>
            <div className="flex items-center gap-2 text-pass-text">
              <Check aria-hidden="true" size={22} />
              <p className="text-body font-semibold">
                {view === "waiting" ? t("scan.saved") : t("scan.savedOffline")}
              </p>
            </div>
            <p className="text-body text-ink-muted">⏳ {t("scan.gradeNext")}</p>
            {/* SPEC.md §4.6: "The farmer can still create the lot; it is
                saved on the phone as a draft" - no need to wait for the
                grade, online or off. */}
            <Link
              to={id ? `/farmer/lots/new?grade=${id}` : "#"}
              className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </>
        )}

        {view === "failed" && (
          <>
            <p className="w-full rounded-card border border-line bg-surface p-4 text-body text-mirchi-text">
              {t(notGradeable ? "grade.notGradeable" : "grade.failed")}
            </p>
            {notGradeable ? (
              <Link
                to={id ? `/farmer/lots/new?grade=${id}` : "#"}
                className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white"
              >
                ✅ {t("grade.createLot")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => id && void retryGrade(id)}
                className="h-14 w-full rounded-button bg-leaf px-6 text-body font-semibold text-white"
              >
                {t("grade.tryAgain")}
              </button>
            )}
          </>
        )}

        {view === "done" && data && isDoneGrade(data) && (
          <>
            {/* grade is `check (grade in ('A','B','C'))` at the DB level -
                isDoneGrade only proves "not null" to TypeScript. The reveal
                gets a small entrance - it's the pay-off moment of the scan. */}
            <div className="animate-fade-slide-in">
              <GradeBadge grade={data.grade as Grade} kind={data.kind === "assured" ? "assured" : "indicative"} />
            </div>
            {data.needs_human_check && (
              <p className="text-meta text-haldi-text">{t("grade.needsHumanCheck")}</p>
            )}
            {data.source === "mock" && <DemoDataTag />}
            {data.needs_human_check && (
              <p className="w-full rounded-card border border-haldi bg-haldi/10 p-4 text-body text-haldi-text">
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
              className="flex h-14 w-full items-center justify-center rounded-button bg-leaf px-6 text-body font-semibold text-white"
            >
              ✅ {t("grade.createLot")}
            </Link>
          </>
        )}

        {view !== "loading" && (
          <Link
            to="/farmer/scan"
            className="flex h-14 items-center justify-center rounded-button border border-line px-6 text-body font-semibold text-ink"
          >
            {t("scan.scanAgain")}
          </Link>
        )}
      </div>
    </div>
  );
}
