// The input for whichever onboarding question is currently active
// (OnboardingPage.tsx renders the transcript + this one live step). Split
// out only because four very different inputs (tap cards, text, GPS button,
// chips) in one file made OnboardingPage.tsx hard to scan - CLAUDE.md §4
// "small files, small functions".
import { useTranslation } from "react-i18next";
import type { SignupRole } from "@shared/schemas/profile.ts";
import type { Crop } from "@shared/crops.ts";
import { CROPS } from "@shared/crops.ts";
import type { StepId } from "./steps";
import { ROLE_OPTIONS, CROP_ICON } from "./constants";

export type LocationStatus = "idle" | "loading" | "saved" | "error";

type Props = {
  step: StepId;
  role: SignupRole | null;
  onSelectRole: (role: SignupRole) => void;
  name: string;
  onNameChange: (value: string) => void;
  village: string;
  onVillageChange: (value: string) => void;
  locationStatus: LocationStatus;
  locationErrorMessage: string | null;
  onUseLocation: () => void;
  onSkipLocation: () => void;
  crops: Crop[];
  onToggleCrop: (crop: Crop) => void;
};

export default function StepInput({
  step,
  role,
  onSelectRole,
  name,
  onNameChange,
  village,
  onVillageChange,
  locationStatus,
  locationErrorMessage,
  onUseLocation,
  onSkipLocation,
  crops,
  onToggleCrop,
}: Props) {
  const { t } = useTranslation();

  if (step === "role") {
    return (
      <div role="group" aria-label={t("onboarding.q.role")} className="grid grid-cols-3 gap-3">
        {ROLE_OPTIONS.map(({ role: r, icon }) => (
          <button
            key={r}
            type="button"
            aria-pressed={role === r}
            onClick={() => onSelectRole(r)}
            className={
              "flex h-30 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all duration-200 active:scale-90 " +
              (role === r
                ? "border-leaf bg-gradient-to-b from-leaf-light to-leaf-light/80 font-black text-leaf-dark shadow-premium ring-4 ring-leaf/20 scale-102"
                : "border-line bg-gradient-to-b from-surface to-surface-subtle/50 font-bold text-ink shadow-card hover:border-leaf/50 hover:bg-surface-subtle")
            }
          >
            <span aria-hidden="true" className="text-4xl transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
            <span className="font-display text-base">{t(`role.${r}`)}</span>
          </button>
        ))}
      </div>
    );
  }

  if (step === "name") {
    return (
      <input
        id="name"
        type="text"
        autoComplete="name"
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-17 w-full rounded-2xl border-2 border-line bg-surface px-5 font-display text-2xl font-bold text-ink shadow-card outline-none transition-all duration-200 focus:border-leaf focus:ring-4 focus:ring-leaf/15"
        placeholder={t("onboarding.namePlaceholder")}
      />
    );
  }

  if (step === "place") {
    return (
      <div className="flex flex-col gap-3.5">
        <input
          id="village"
          type="text"
          autoComplete="address-level2"
          autoFocus
          value={village}
          onChange={(e) => onVillageChange(e.target.value)}
          className="h-17 w-full rounded-2xl border-2 border-line bg-surface px-5 font-display text-2xl font-bold text-ink shadow-card outline-none transition-all duration-200 focus:border-leaf focus:ring-4 focus:ring-leaf/15"
          placeholder={t("onboarding.placePlaceholder")}
        />
        <p className="text-meta font-medium text-ink-muted">{t("onboarding.pilotArea")}</p>

        {locationStatus === "saved" ? (
          <p className="inline-flex items-center gap-2 self-start rounded-full border-2 border-pass/40 bg-pass-light px-4.5 py-2 text-meta font-bold text-pass-text shadow-xs">
            <span>📍</span>
            <span>{t("onboarding.locationSaved")}</span>
          </p>
        ) : (
          <button
            type="button"
            disabled={locationStatus === "loading"}
            onClick={onUseLocation}
            className="flex h-15 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-gradient-to-r from-surface to-surface-subtle/50 text-card font-bold text-leaf-dark shadow-card transition-all duration-200 hover:border-leaf hover:bg-leaf-light/40 active:scale-95 disabled:text-ink-muted"
          >
            <span>📍</span>
            <span>
              {locationStatus === "loading"
                ? t("onboarding.gettingLocation")
                : t("onboarding.useMyLocation")}
            </span>
          </button>
        )}

        {locationStatus === "error" && (
          <div className="mt-1 rounded-2xl border-2 border-mirchi/30 bg-mirchi-light p-3.5 shadow-xs">
            <p className="text-meta font-semibold text-mirchi-text">{locationErrorMessage}</p>
            <button
              type="button"
              onClick={onSkipLocation}
              className="mt-1 font-display text-meta font-bold text-ink-muted underline"
            >
              {t("onboarding.locationSkip")}
            </button>
          </div>
        )}

        {village.trim().length === 0 && locationStatus !== "saved" && (
          <p className="text-meta font-medium text-ink-muted">{t("onboarding.placeNeeded")}</p>
        )}
      </div>
    );
  }

  return (
    <div role="group" aria-label={t("onboarding.q.crops")} className="flex flex-wrap gap-3.5">
      {CROPS.map((crop) => (
        <button
          key={crop}
          type="button"
          aria-pressed={crops.includes(crop)}
          onClick={() => onToggleCrop(crop)}
          className={
            "flex h-15 items-center gap-2.5 rounded-2xl border-2 px-6 text-card font-bold transition-all duration-200 active:scale-95 " +
            (crops.includes(crop)
              ? "border-leaf bg-leaf text-white shadow-hero scale-105 ring-2 ring-leaf/20"
              : "border-line bg-gradient-to-r from-surface to-surface-subtle/50 text-ink shadow-card hover:border-leaf/50 hover:bg-surface-subtle")
          }
        >
          <span aria-hidden="true" className="text-2xl">{CROP_ICON[crop]}</span>
          <span className="font-display">{t(`crop.${crop}`)}</span>
        </button>
      ))}
    </div>
  );
}
