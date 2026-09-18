// Create lot screen (SPEC.md §4.7 left panel): "How many kg?" NumberPad +
// automatic GPS. Reached from ScanResultPage's "✅ Create lot" button with
// the scan's grade_results id in the URL. saveLot() (services/lots.ts)
// always succeeds, online or off (SPEC.md §4.6 "saved on the phone as a
// draft") - there is nothing here wrapped in <RequireOnline>.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import NumberPad from "@/components/common/NumberPad";
import VoiceButton from "@/components/voice/VoiceButton";
import { useAuth } from "@/app/authContext";
import { useGradeResult } from "@/services/grading";
import { isDoneGrade } from "@/components/lot/gradeDisplay";
import { buildLotInput, saveLot } from "@/services/lots";
import { getCurrentLocation, type Coordinates } from "@/lib/native";
import { toAppError, type AppError } from "@/lib/errors";
import type { Grade } from "@shared/schemas/grade.ts";
import type { Crop } from "@shared/crops.ts";

export default function NewLotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const gradeResultId = searchParams.get("grade");

  const { data: gradeRow } = useGradeResult(gradeResultId ?? undefined);
  const grade: Grade | null = gradeRow && isDoneGrade(gradeRow) ? (gradeRow.grade as Grade) : null;

  // grade_results.crop is what ScanPage actually saved this scan's photos
  // under (the `grade` Edge Function writes it from the same draft, before
  // it even calls the AI service) - prefer it so the lot can never disagree
  // with its own photos. Only missing when the grade request hasn't reached
  // the server yet (fully offline); the farmer's own crop list is the same
  // best-effort fallback ScanPage itself would have used.
  const crops = (profile?.crops ?? []) as Crop[];
  const crop: Crop = (gradeRow?.crop as Crop | undefined) ?? crops[0] ?? "onion";

  const [kg, setKg] = useState("0");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Automatic, not a button (unlike onboarding's "Use my location") - SPEC.md
  // §4.7's wireframe shows the GPS line filling in on its own. A denied or
  // failed lookup is never shown as an error here (SPEC.md §6.7 "advisory,
  // never blocks") - the village name alone is a perfectly good fallback.
  useEffect(() => {
    getCurrentLocation()
      .then(setLocation)
      .catch(() => setLocation(null));
  }, []);

  if (!gradeResultId) return <Navigate to="/farmer/scan" replace />;

  const quantityKg = Number(kg);
  const canSave = quantityKg > 0 && !saving;

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const input = buildLotInput({
        id: crypto.randomUUID(),
        crop,
        quantityKg,
        gradeResultId,
        grade,
        location,
      });
      await saveLot(input);
      navigate(`/farmer/lots/${input.id}`, { replace: true });
    } catch (err) {
      setError(toAppError(err));
      setSaving(false);
    }
  }

  const cropLabel = t(`crop.${crop}`);
  const locationLine = location
    ? t("lots.location", { place: profile?.village ?? "" })
    : (profile?.village ?? t("lots.locationUnknown"));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            to={`/farmer/scan/result/${gradeResultId}`}
            aria-label={t("onboarding.back")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-xs active:scale-90 transition-all"
          >
            <ArrowLeft aria-hidden="true" size={20} className="text-ink" />
          </Link>
          <h1 className="text-title font-display font-bold text-ink">{t("lots.newTitle")}</h1>
        </div>
        <VoiceButton textKey="lots.newTitle" />
      </div>

      <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">{cropLabel}</p>

      <NumberPad value={kg} onChange={setKg} unit={t("lots.kg")} />

      <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-surface px-3.5 py-1 text-meta font-medium text-ink-muted shadow-xs">
        <span>📍</span>
        <span>{locationLine}</span>
      </p>

      {error && (
        <p className="rounded-2xl border border-mirchi/30 bg-mirchi-light p-4 text-body font-medium text-mirchi-text shadow-card">
          {t(error.messageKey)}
        </p>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={() => void handleSave()}
        className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs transition-all active:scale-[0.98] disabled:bg-line disabled:text-ink-muted"
      >
        {t("lots.save")}
      </button>
    </div>
  );
}
