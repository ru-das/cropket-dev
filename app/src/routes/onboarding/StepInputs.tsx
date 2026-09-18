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
              "flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border shadow-card transition-all duration-150 active:scale-95 " +
              (role === r
                ? "border-2 border-leaf bg-leaf-light font-bold text-leaf-dark shadow-xs"
                : "border-line bg-surface font-medium text-ink hover:bg-surface-subtle")
            }
          >
            <span aria-hidden="true" className="text-3xl">
              {icon}
            </span>
            <span className="text-meta">{t(`role.${r}`)}</span>
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
        className="h-14 w-full rounded-xl border border-line bg-surface px-4 text-body font-medium text-ink shadow-card outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
        placeholder={t("onboarding.namePlaceholder")}
      />
    );
  }

  if (step === "place") {
    return (
      <div className="flex flex-col gap-2">
        <input
          id="village"
          type="text"
          autoComplete="address-level2"
          autoFocus
          value={village}
          onChange={(e) => onVillageChange(e.target.value)}
          className="h-14 w-full rounded-xl border border-line bg-surface px-4 text-body font-medium text-ink shadow-card outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          placeholder={t("onboarding.placePlaceholder")}
        />
        <p className="text-meta text-ink-muted">{t("onboarding.pilotArea")}</p>

        {locationStatus === "saved" ? (
          <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-pass/30 bg-pass-light px-3 py-1 text-meta font-semibold text-pass-text shadow-xs">
            <span>📍</span>
            <span>{t("onboarding.locationSaved")}</span>
          </p>
        ) : (
          <button
            type="button"
            disabled={locationStatus === "loading"}
            onClick={onUseLocation}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-line bg-surface text-meta font-semibold text-leaf-dark shadow-xs transition-all hover:bg-leaf-light/30 active:scale-95 disabled:text-ink-muted"
          >
            {locationStatus === "loading"
              ? t("onboarding.gettingLocation")
              : `📍 ${t("onboarding.useMyLocation")}`}
          </button>
        )}

        {locationStatus === "error" && (
          <div className="mt-1">
            <p className="text-meta text-mirchi-text">{locationErrorMessage}</p>
            <button
              type="button"
              onClick={onSkipLocation}
              className="mt-1 text-meta font-semibold text-ink-muted underline"
            >
              {t("onboarding.locationSkip")}
            </button>
          </div>
        )}

        {village.trim().length === 0 && locationStatus !== "saved" && (
          <p className="text-meta text-ink-muted">{t("onboarding.placeNeeded")}</p>
        )}
      </div>
    );
  }

  return (
    <div role="group" aria-label={t("onboarding.q.crops")} className="flex flex-wrap gap-2.5">
      {CROPS.map((crop) => (
        <button
          key={crop}
          type="button"
          aria-pressed={crops.includes(crop)}
          onClick={() => onToggleCrop(crop)}
          className={
            "flex h-13 items-center gap-2 rounded-full border px-5 text-body font-semibold shadow-xs transition-all active:scale-95 " +
            (crops.includes(crop)
              ? "border-leaf bg-leaf text-white shadow-xs"
              : "border-line bg-surface text-ink hover:bg-surface-subtle")
          }
        >
          <span aria-hidden="true" className="text-xl">{CROP_ICON[crop]}</span>
          <span>{t(`crop.${crop}`)}</span>
        </button>
      ))}
    </div>
  );
}
