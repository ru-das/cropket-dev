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

  const headerOverlay = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            to="/farmer"
            aria-label={t("onboarding.back")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white/25 bg-black/45 text-white shadow-float backdrop-blur-md transition-all duration-200 active:scale-90 hover:border-white/40 hover:bg-black/65"
          >
            <ArrowLeft aria-hidden="true" size={22} className="text-white" />
          </Link>
          <h1 className="font-display text-2xl font-black text-white tracking-tight drop-shadow-md">
            {t("scan.title", { crop: cropLabel })}
          </h1>
        </div>
        <VoiceButton
          textKey="scan.title"
          values={{ crop: cropLabel }}
          className="border-white/25 bg-black/45 text-white shadow-float backdrop-blur-md hover:border-white/40 hover:bg-black/65"
        />
      </div>

      {crops.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {crops.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              className={
                "flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 font-display text-sm font-bold backdrop-blur-md transition-all duration-200 active:scale-95 " +
                (c === crop
                  ? "border-2 border-leaf bg-leaf text-white shadow-glow-leaf scale-102"
                  : "border border-white/25 bg-black/45 text-white/90 hover:bg-black/65")
              }
            >
              <span aria-hidden="true" className="text-lg">{c === "onion" ? "🧅" : c === "tomato" ? "🍅" : "🥔"}</span>
              <span>{t(`crop.${c}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {saveError ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none">
          <div className="absolute inset-x-0 top-0 z-10 p-3 md:p-4">
            <div className="mx-auto w-full max-w-xl">{headerOverlay}</div>
          </div>
          <div className="max-w-md rounded-3xl border-2 border-line bg-surface p-6 shadow-hero">
            <p className="font-body text-base font-semibold text-mirchi-text mb-4">
              {t(saveError.messageKey)}
            </p>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="h-12 w-full rounded-2xl bg-leaf font-display text-base font-bold text-white shadow-card active:scale-95"
            >
              {t("onboarding.back")}
            </button>
          </div>
        </div>
      ) : (
        <SmartFrameCamera
          crop={crop}
          headerOverlay={headerOverlay}
          onDone={(blobs) => void handleDone(blobs)}
        />
      )}
    </div>
  );
}
