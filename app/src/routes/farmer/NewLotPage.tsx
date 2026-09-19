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

  const crops = (profile?.crops ?? []) as Crop[];
  const crop: Crop = (gradeRow?.crop as Crop | undefined) ?? crops[0] ?? "onion";

  const [kg, setKg] = useState("0");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

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
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            to={`/farmer/scan/result/${gradeResultId}`}
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-ink" />
          </Link>
          <h1 className="text-title font-display text-ink">{t("lots.newTitle")}</h1>
        </div>
        <VoiceButton textKey="lots.newTitle" />
      </div>

      <p className="mt-2 text-body text-ink-muted">{cropLabel}</p>

      <div className="mt-2">
        <NumberPad value={kg} onChange={setKg} unit={t("lots.kg")} />
      </div>

      <p className="mt-2 text-meta text-ink-muted">📍 {locationLine}</p>

      {error && (
        <p className="mt-4 rounded-card border border-mirchi/30 bg-mirchi/5 p-4 text-body text-mirchi-text">
          {t(error.messageKey)}
        </p>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={() => void handleSave()}
        className="mt-6 h-14 w-full rounded-button bg-leaf px-6 text-body font-semibold text-white shadow-[var(--shadow-soft)] disabled:bg-line disabled:text-ink-muted"
      >
        {t("lots.save")}
      </button>
    </div>
  );
}
