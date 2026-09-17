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
              "flex h-20 flex-col items-center justify-center gap-1 rounded-card border text-meta font-semibold " +
              (role === r
                ? "border-leaf bg-leaf/10 text-leaf-dark"
                : "border-line bg-surface text-ink")
            }
          >
            <span aria-hidden="true" className="text-title">
              {icon}
            </span>
            {t(`role.${r}`)}
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
        className="h-14 w-full rounded-button border border-line bg-surface px-3 text-body text-ink outline-none"
        placeholder={t("onboarding.namePlaceholder")}
      />
    );
  }

  if (step === "place") {
    return (
      <div>
        <input
          id="village"
          type="text"
          autoComplete="address-level2"
          autoFocus
          value={village}
          onChange={(e) => onVillageChange(e.target.value)}
          className="h-14 w-full rounded-button border border-line bg-surface px-3 text-body text-ink outline-none"
          placeholder={t("onboarding.placePlaceholder")}
        />
        <p className="mt-1 text-meta text-ink-muted">{t("onboarding.pilotArea")}</p>

        {locationStatus === "saved" ? (
          <p className="mt-3 text-meta font-semibold text-pass-text">
            📍 {t("onboarding.locationSaved")}
          </p>
        ) : (
          <button
            type="button"
            disabled={locationStatus === "loading"}
            onClick={onUseLocation}
            className="mt-3 h-12 w-full rounded-button border border-line bg-surface text-meta font-semibold text-leaf-dark disabled:text-ink-muted"
          >
            {locationStatus === "loading"
              ? t("onboarding.gettingLocation")
              : `📍 ${t("onboarding.useMyLocation")}`}
          </button>
        )}

        {locationStatus === "error" && (
          <div className="mt-2">
            <p className="text-meta text-mirchi-text">{locationErrorMessage}</p>
            <button
              type="button"
              onClick={onSkipLocation}
              className="mt-1 h-12 text-meta font-semibold text-ink-muted underline"
            >
              {t("onboarding.locationSkip")}
            </button>
          </div>
        )}

        {village.trim().length === 0 && locationStatus !== "saved" && (
          <p className="mt-3 text-meta text-ink-muted">{t("onboarding.placeNeeded")}</p>
        )}
      </div>
    );
  }

  return (
    <div role="group" aria-label={t("onboarding.q.crops")} className="flex flex-wrap gap-3">
      {CROPS.map((crop) => (
        <button
          key={crop}
          type="button"
          aria-pressed={crops.includes(crop)}
          onClick={() => onToggleCrop(crop)}
          className={
            "flex h-14 items-center gap-2 rounded-button border px-4 text-body font-semibold " +
            (crops.includes(crop)
              ? "border-leaf bg-leaf/10 text-leaf-dark"
              : "border-line bg-surface text-ink")
          }
        >
          <span aria-hidden="true">{CROP_ICON[crop]}</span>
          {t(`crop.${crop}`)}
        </button>
      ))}
    </div>
  );
}
