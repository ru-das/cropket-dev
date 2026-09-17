// Scan crop screen (SPEC.md §4.5, §4.6 "offline" note). Opens
// SmartFrameCamera; once its 3 shots are done, saves them to the phone and
// queues the upload (services/photos.ts), then shows a short confirmation.
// 1.5 replaces this confirmation with the real grade result screen once
// grading (1.3/1.4) exists - `saved`/`scanAgain` here are placeholders for it.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import SmartFrameCamera from "@/components/camera/SmartFrameCamera";
import VoiceButton from "@/components/voice/VoiceButton";
import { useOnline } from "@/offline/network";
import { saveScanPhotos } from "@/services/photos";
import { toAppError, type AppError } from "@/lib/errors";

const CROP = "onion" as const;

export default function ScanPage() {
  const { t } = useTranslation();
  const online = useOnline();
  const [photos, setPhotos] = useState<Blob[] | null>(null);
  // Thumbnail URLs for the confirmation screen - made alongside `photos`
  // (handleDone / handleScanAgain below), not derived in an effect, so
  // nothing but the cleanup below ever revokes them. This is the only place
  // in the app that creates object URLs.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<AppError | null>(null);

  // Revokes whichever URLs are current, on the next change and on unmount.
  useEffect(() => {
    return () => photoUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoUrls]);

  async function handleDone(blobs: Blob[]) {
    try {
      await saveScanPhotos(CROP, blobs);
      setSaveError(null);
      setPhotos(blobs);
      setPhotoUrls(blobs.map((blob) => URL.createObjectURL(blob)));
    } catch (err) {
      setSaveError(toAppError(err));
    }
  }

  function handleScanAgain() {
    setPhotos(null);
    setPhotoUrls([]);
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
        ) : photos ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-pass-text">
              <Check aria-hidden="true" size={22} />
              <p className="text-body font-semibold">
                {online ? t("scan.saved") : t("scan.savedOffline")}
              </p>
            </div>
            <div className="flex gap-2">
              {photoUrls.map((url, i) => (
                <img
                  key={url}
                  src={url}
                  alt={t("scan.photoOf", { n: i + 1, total: photos.length })}
                  className="h-20 w-20 rounded-card border border-line object-cover"
                />
              ))}
            </div>
            <p className="text-meta text-ink-muted">{t("scan.gradeNext")}</p>
            <button
              type="button"
              onClick={handleScanAgain}
              className="h-14 rounded-button border border-line px-6 text-body font-semibold text-ink"
            >
              {t("scan.scanAgain")}
            </button>
          </div>
        ) : (
          <SmartFrameCamera crop={CROP} onDone={(blobs) => void handleDone(blobs)} />
        )}
      </div>
    </div>
  );
}
