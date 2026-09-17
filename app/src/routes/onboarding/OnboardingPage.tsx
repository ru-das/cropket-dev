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
import { toAppError } from "@/lib/errors";
import { useOnline } from "@/offline/network";
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
          ? village.trim().length > 0
          : crops.length > 0;

  function toggleCrop(crop: Crop) {
    setCrops((prev) => (prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]));
  }

  async function handleUseLocation() {
    setLocationStatus("loading");
    setLocationErrorMessage(null);
    try {
      setLocation(await getCurrentLocation());
      setLocationStatus("saved");
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
        village: village.trim(),
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
        return locationStatus === "saved" ? `${village} · 📍` : village;
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
            className="flex h-12 w-12 items-center justify-center rounded-button text-title text-ink"
          >
            ←
          </button>
        ) : (
          <span />
        )}
        <p className="text-meta font-semibold text-ink-muted">
          {t("onboarding.title")} ·{" "}
          {t("onboarding.stepOf", { step: currentIndex + 1, total: steps.length })}
        </p>
      </div>

      <div className="mx-auto mt-4 w-full max-w-sm flex-1">
        {steps.slice(0, currentIndex + 1).map((step, index) => {
          const isCurrent = index === currentIndex;
          return (
            <div key={step} ref={isCurrent ? currentRef : undefined} className="mt-6 first:mt-2">
              <div className="flex items-center gap-2">
                <p className="text-card font-display text-ink">🌾 {t(questionKey(step, role))}</p>
                <VoiceButton textKey={questionKey(step, role)} />
              </div>

              {isCurrent ? (
                <div className="mt-3">
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
                <p className="mt-1 text-meta text-ink-muted">{summaryFor(step)}</p>
              )}
            </div>
          );
        })}

        {error && <p className="mt-4 text-meta text-mirchi-text">{error}</p>}

        <button
          type="button"
          disabled={primaryDisabled}
          onClick={handlePrimary}
          className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white disabled:opacity-40"
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
