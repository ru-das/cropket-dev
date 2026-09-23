// The driver's own page, no login (SPEC.md §4.16, §5.3, §5.4, §5.6, §9.2
// Phase 4 "4.7"). Two steps in the prototype - SPEC §5.4 lists five, but
// weighbridge/start/GPS-tracking are Phase 5's full checklist, P1, out of
// scope (AGENTS.md "prototype scope"):
//   1. IN_TRANSIT -> a delivery photo (record_pod, escrow -> DELIVERED)
//   2. DELIVERED  -> the buyer's 4-digit code (record_otp_attempt)
// Both need internet here - no offline tripQueue yet (`ponytail:` comment
// in the `trip` Edge Function's own file header has the upgrade path).
//
// Reuses SmartFrameCamera (shots=1) for the photo, same dark-photo guard
// and ≤300KB compression the farmer's own scan screen gets - a
// driver-specific camera variant (its reticle text/₹10 coin hint are
// farmer-scan wording, not quite right here) is a nice-to-have, not P0.
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { KeyRound } from "lucide-react";
import LanguageSwitch from "@/components/shell/LanguageSwitch";
import SmartFrameCamera from "@/components/camera/SmartFrameCamera";
import VoiceButton from "@/components/voice/VoiceButton";
import RequireOnline from "@/components/common/RequireOnline";
import { useOnline } from "@/offline/network";
import { getCurrentLocation } from "@/lib/native";
import { useTrip, useUploadPod, useSubmitOtp } from "@/services/trip";
import { toAppError, type AppError } from "@/lib/errors";

function CenteredMessage({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-subtle p-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        {icon}
      </p>
      <p className="font-display text-lg font-bold text-ink">{children}</p>
      <LanguageSwitch />
    </div>
  );
}

export default function TripPage() {
  const { t } = useTranslation();
  const { token = "" } = useParams<{ token: string }>();
  const online = useOnline();
  const { data: trip, isLoading, isError } = useTrip(token);
  const uploadPod = useUploadPod(token);
  const submitOtp = useSubmitOtp(token);

  const [podError, setPodError] = useState<AppError | null>(null);
  const [otp, setOtp] = useState("");
  const [otpResult, setOtpResult] = useState<{ correct: boolean; triesLeft: number } | null>(null);
  const [otpError, setOtpError] = useState<AppError | null>(null);

  async function handlePhoto(photos: Blob[]) {
    setPodError(null);
    const photo = photos[0];
    if (!photo) return;
    // GPS denied/unavailable never blocks delivery (CLAUDE.md §5) - the
    // photo still uploads with no location.
    const location = await getCurrentLocation().catch(() => null);
    try {
      await uploadPod.mutateAsync({
        photo,
        lat: location?.lat,
        lng: location?.lng,
        takenAt: new Date().toISOString(),
      });
    } catch (err) {
      setPodError(toAppError(err));
    }
  }

  async function handleOtpSubmit() {
    setOtpError(null);
    setOtpResult(null);
    try {
      const result = await submitOtp.mutateAsync({ otp });
      setOtpResult(result);
      setOtp("");
    } catch (err) {
      setOtpError(toAppError(err));
    }
  }

  if (isLoading) {
    return <CenteredMessage icon="🚚">{t("common.loading")}</CenteredMessage>;
  }

  if (isError || !trip) {
    // Same calm message whether the token is unknown, expired, or the
    // request never reached the server offline - a driver can't tell those
    // apart anyway, and doesn't need to.
    return <CenteredMessage icon="🚧">{t(!online ? "trip.needsInternetLoad" : "trip.expired")}</CenteredMessage>;
  }

  const cropLabel = t(`crop.${trip.crop}`);

  if (trip.state === "IN_TRANSIT") {
    if (!online) {
      return <CenteredMessage icon="🧭">{t("trip.needsInternetPhoto")}</CenteredMessage>;
    }
    const headerOverlay = (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-black text-white drop-shadow-md">{trip.vehicleNumber}</p>
          <p className="font-body text-sm text-white/85">
            {t("trip.podStep", { crop: cropLabel, kg: trip.quantityKg })}
          </p>
        </div>
        <LanguageSwitch />
      </div>
    );
    return (
      <div className="relative h-dvh w-full">
        <SmartFrameCamera
          crop={trip.crop}
          shots={1}
          onDone={(photos) => void handlePhoto(photos)}
          headerOverlay={headerOverlay}
        />
        {podError && (
          <div className="absolute inset-x-4 bottom-28 z-20 mx-auto max-w-sm rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-3 text-center shadow-hero">
            <p className="text-meta font-semibold text-mirchi-text">{t(podError.messageKey)}</p>
          </div>
        )}
      </div>
    );
  }

  if (trip.state === "DELIVERED") {
    const locked = otpError?.code === "OTP_LOCKED";
    return (
      <div className="flex min-h-dvh flex-col bg-surface-subtle">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface p-4">
          <div>
            <p className="font-display text-lg font-black text-ink">{trip.vehicleNumber}</p>
            <p className="text-meta text-ink-muted">{t("trip.otpStep", { crop: cropLabel, kg: trip.quantityKg })}</p>
          </div>
          <LanguageSwitch />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-light text-leaf shadow-glow-leaf">
            <KeyRound aria-hidden="true" size={28} />
          </div>
          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-bold text-ink">{t("trip.enterCode")}</p>
            <VoiceButton textKey="trip.enterCode" className="h-9 w-9 shadow-xs" />
          </div>

          {!locked && !otpResult?.correct && (
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              autoFocus
              className="h-20 w-48 rounded-2xl border-2 border-line bg-surface text-center font-display text-4xl font-black tracking-[0.5em] tabular-nums text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            />
          )}

          {otpResult?.correct && (
            <p className="font-display text-lg font-bold text-pass-text">✅ {t("trip.codeCorrect")}</p>
          )}
          {otpResult && !otpResult.correct && (
            <p className="font-display text-lg font-bold text-mirchi-text">
              {t("trip.codeWrong", { n: otpResult.triesLeft })}
            </p>
          )}
          {otpError && <p className="text-meta font-semibold text-mirchi-text">{t(otpError.messageKey)}</p>}

          {!locked && !otpResult?.correct && (
            <RequireOnline reasonKey="trip.needsInternet">
              <button
                type="button"
                disabled={otp.length !== 4 || submitOtp.isPending}
                onClick={() => void handleOtpSubmit()}
                className="flex h-14 w-48 items-center justify-center rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
              >
                {t("trip.submitCode")}
              </button>
            </RequireOnline>
          )}
        </div>
      </div>
    );
  }

  // RELEASED (4.8/4.9) or anything else past DELIVERED - the driver's job
  // is done either way.
  return <CenteredMessage icon="✅">{t("trip.done")}</CenteredMessage>;
}
