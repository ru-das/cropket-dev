// Scan crop screen (SPEC.md §4.5). Opens SmartFrameCamera; once its 3 shots
// are done, saves them to the phone and queues the upload + grade request
// (services/photos.ts), then hands off to ScanResultPage (1.5) - the draft
// id saveScanPhotos returns doubles as the grade_results row's id (SPEC.md
// §5.6 "made on the phone").
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Crop } from "@shared/crops.ts";
import SmartFrameCamera from "@/components/camera/SmartFrameCamera";
import VoiceButton from "@/components/voice/VoiceButton";
import { useAuth } from "@/app/authContext";
import { saveScanPhotos } from "@/services/photos";
import { toAppError, type AppError } from "@/lib/errors";

export default function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [saveError, setSaveError] = useState<AppError | null>(null);

  // Same crop the farmer picked in onboarding, not a fixed one (that was the
  // P0 bug: a tomato farmer was told "Scan onion" and the lot saved as
  // onion). Multiple crops on file -> let them confirm which one, same
  // chip pattern as PricesPage. No crops on file -> onion, same fallback
  // PricesPage uses.
  const crops = (profile?.crops ?? []) as Crop[];
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(crops[0] ?? null);
  const crop: Crop = selectedCrop ?? crops[0] ?? "onion";

  async function handleDone(blobs: Blob[]) {
    try {
      const id = await saveScanPhotos(crop, blobs);
      navigate(`/farmer/scan/result/${id}`, { replace: true });
    } catch (err) {
      setSaveError(toAppError(err));
    }
  }

  const cropLabel = t(`crop.${crop}`);

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
          <h1 className="text-title font-display text-ink">
            {t("scan.title", { crop: cropLabel })}
          </h1>
        </div>
        <VoiceButton textKey="scan.title" values={{ crop: cropLabel }} />
      </div>

      {crops.length > 1 && (
        <div className="mt-4 flex gap-2">
          {crops.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              className={
                c === crop
                  ? "h-12 rounded-button border border-leaf bg-leaf px-4 text-body font-semibold text-white"
                  : "h-12 rounded-button border border-line bg-surface px-4 text-body font-semibold text-ink"
              }
            >
              {t(`crop.${c}`)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {saveError ? (
          <p className="rounded-card border border-line bg-surface p-4 text-body text-mirchi-text">
            {t(saveError.messageKey)}
          </p>
        ) : (
          <SmartFrameCamera crop={crop} onDone={(blobs) => void handleDone(blobs)} />
        )}
      </div>
    </div>
  );
}
