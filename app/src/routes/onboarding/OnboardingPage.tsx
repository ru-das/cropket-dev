// First-time setup after login (SPEC.md §4.3): a chat-style flow, one
// question at a time, answered questions staying on screen as the person
// moves down. Farmer and FPO answer role → name → village + GPS → crops;
// a buyer stops after village + GPS (SPEC.md §9.2 Phase 1 table - a buyer
// doesn't grow anything). Needs internet (SPEC.md §3.1 route table), so
// nothing here goes in the offline outbox.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { useAuth } from "@/app/authContext";
import { homeFor } from "@/lib/roles";
import { createMyProfile } from "@/services/profiles";
import { getCurrentLocation, type Coordinates } from "@/lib/native";
import { reverseGeocodeVillage } from "@/lib/geocode";
import { toAppError } from "@/lib/errors";
import { useOnline } from "@/offline/network";
import { ArrowLeft } from "lucide-react";
import VoiceButton from "@/components/voice/VoiceButton";
import { SignupRole, type SignupRole as SignupRoleT } from "@shared/schemas/profile.ts";
import type { Crop } from "@shared/crops.ts";
import { stepsFor, type StepId } from "./steps";
import StepInput, { type LocationStatus } from "./StepInputs";
import { ROLE_OPTIONS, CROP_ICON } from "./constants";

function questionKey(step: StepId, role: SignupRoleT | null): ParseKeys {
  switch (step) {
    case "role":
      return "onboarding.q.role";
    case "name":
      return "onboarding.q.name";
    case "place":
      return role === "buyer" ? "onboarding.q.placeBuyer" : "onboarding.q.place";
    case "crops":
      return "onboarding.q.crops";
  }
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const online = useOnline();

  const [role, setRole] = useState<SignupRoleT | null>(null);
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const steps = stepsFor(role);
  const currentStep = steps[currentIndex] ?? "role";
  const isLastStep = currentIndex === steps.length - 1;

  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentIndex]);

  const canAdvance =
    currentStep === "role"
      ? role !== null
      : currentStep === "name"
        ? name.trim().length > 0
        : currentStep === "place"
          ? village.trim().length > 0 || locationStatus === "saved"
          : crops.length > 0;

  function toggleCrop(crop: Crop) {
    setCrops((prev) => (prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]));
  }

  async function handleUseLocation() {
    setLocationStatus("loading");
    setLocationErrorMessage(null);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      setLocationStatus("saved");
      // Best-effort autofill only - never overwrite a name the farmer
      // already typed, including one typed while this call was in flight.
      const guess = await reverseGeocodeVillage(coords);
      if (guess) setVillage((current) => (current.trim() ? current : guess));
    } catch (err) {
      setLocation(null);
      setLocationStatus("error");
      setLocationErrorMessage(t(toAppError(err).messageKey));
    }
  }

  function handleSkipLocation() {
    setLocationStatus("idle");
    setLocationErrorMessage(null);
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  async function handleSubmit() {
    const parsedRole = SignupRole.safeParse(role);
    if (!parsedRole.success || !canAdvance) return;
    setError(null);
    setBusy(true);
    try {
      const profile = await createMyProfile({
        name: name.trim(),
        role: parsedRole.data,
        village: village.trim() || null,
        // A buyer's crops (if any survive a Back-and-switch-role) are never
        // sent - a buyer row never carries crops (SPEC.md §9.2 Phase 1).
        crops: parsedRole.data === "buyer" ? [] : crops,
        location,
      });
      await refreshProfile();
      navigate(homeFor(profile.role), { replace: true });
    } catch (err) {
      setError(t(toAppError(err).messageKey));
      setBusy(false);
    }
  }

  function handlePrimary() {
    if (isLastStep) void handleSubmit();
    else setCurrentIndex((i) => i + 1);
  }

  function summaryFor(step: StepId): string {
    switch (step) {
      case "role": {
        const icon = ROLE_OPTIONS.find((r) => r.role === role)?.icon ?? "";
        return role ? `${icon} ${t(`role.${role}`)}` : "";
      }
      case "name":
        return name;
      case "place":
        return locationStatus === "saved"
          ? [village.trim(), "📍"].filter(Boolean).join(" · ")
          : village;
      case "crops":
        return crops.map((c) => `${CROP_ICON[c]} ${t(`crop.${c}`)}`).join("  ");
    }
  }

  const primaryDisabled = isLastStep ? !canAdvance || busy || !online : !canAdvance || busy;

  return (
    <div className="flex min-h-screen flex-col bg-field p-4">
      <div className="flex items-center justify-between">
        {currentIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("onboarding.back")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface shadow-xs active:scale-90 transition-all"
          >
            <ArrowLeft aria-hidden="true" size={20} className="text-ink" />
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-3 py-1 shadow-xs">
          <div className="h-2 w-14 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-leaf transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-meta font-semibold text-ink-muted">
            {t("onboarding.stepOf", { step: currentIndex + 1, total: steps.length })}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-sm flex-1">
        {steps.slice(0, currentIndex + 1).map((step, index) => {
          const isCurrent = index === currentIndex;
          return (
            <div
              key={step}
              ref={isCurrent ? currentRef : undefined}
              className={isCurrent ? "animate-fade-slide-in mt-4 first:mt-2" : "mt-3 first:mt-2"}
            >
              {isCurrent ? (
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="flex items-center gap-2 text-card font-display font-semibold text-ink">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-light text-sm">
                        🌾
                      </span>
                      <span>{t(questionKey(step, role))}</span>
                    </p>
                    <VoiceButton textKey={questionKey(step, role)} />
                  </div>
                  <StepInput
                    step={step}
                    role={role}
                    onSelectRole={setRole}
                    name={name}
                    onNameChange={setName}
                    village={village}
                    onVillageChange={setVillage}
                    locationStatus={locationStatus}
                    locationErrorMessage={locationErrorMessage}
                    onUseLocation={() => void handleUseLocation()}
                    onSkipLocation={handleSkipLocation}
                    crops={crops}
                    onToggleCrop={toggleCrop}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-line/80 bg-surface-subtle px-3.5 py-2.5 shadow-xs">
                  <span className="text-meta font-medium text-ink-muted">{t(questionKey(step, role))}</span>
                  <span className="text-meta font-semibold text-ink">{summaryFor(step)}</span>
                </div>
              )}
            </div>
          );
        })}

        {error && <p className="mt-4 text-meta font-medium text-mirchi-text">{error}</p>}

        <button
          type="button"
          disabled={primaryDisabled}
          onClick={handlePrimary}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-leaf text-body font-semibold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {isLastStep ? t("onboarding.finish") : t("onboarding.next")}
        </button>
        {isLastStep && !online && (
          <p className="mt-2 text-center text-meta text-ink-muted">
            {t("onboarding.needsInternet")}
          </p>
        )}
      </div>
    </div>
  );
}
