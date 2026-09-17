// Scan crop screen (SPEC.md §4.5). Opens SmartFrameCamera; once its 3 shots
// are done, saves them to the phone and queues the upload + grade request
// (services/photos.ts), then hands off to ScanResultPage (1.5) - the draft
// id saveScanPhotos returns doubles as the grade_results row's id (SPEC.md
// §5.6 "made on the phone").
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import SmartFrameCamera from "@/components/camera/SmartFrameCamera";
import VoiceButton from "@/components/voice/VoiceButton";
import { saveScanPhotos } from "@/services/photos";
import { toAppError, type AppError } from "@/lib/errors";

const CROP = "onion" as const;

export default function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState<AppError | null>(null);

  async function handleDone(blobs: Blob[]) {
    try {
      const id = await saveScanPhotos(CROP, blobs);
      navigate(`/farmer/scan/result/${id}`, { replace: true });
    } catch (err) {
      setSaveError(toAppError(err));
    }
  }

  const cropLabel = t(`crop.${CROP}`);

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

      <div className="mt-4">
        {saveError ? (
          <p className="rounded-card border border-line bg-surface p-4 text-body text-mirchi-text">
            {t(saveError.messageKey)}
          </p>
        ) : (
          <SmartFrameCamera crop={CROP} onDone={(blobs) => void handleDone(blobs)} />
        )}
      </div>
    </div>
  );
}
