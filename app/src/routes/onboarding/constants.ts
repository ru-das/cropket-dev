// Icons for onboarding's tap choices (role cards, crop chips). Kept out of
// StepInputs.tsx because a component file may only export components (React
// Fast Refresh rule) - CLAUDE.md §4 "small files, small functions".
import type { SignupRole } from "@shared/schemas/profile.ts";
import type { Crop } from "@shared/crops.ts";

export const ROLE_OPTIONS: { role: SignupRole; icon: string }[] = [
  { role: "farmer", icon: "🧑‍🌾" },
  { role: "buyer", icon: "🏢" },
  { role: "fpo", icon: "👥" },
];

export const CROP_ICON: Record<Crop, string> = {
  onion: "🧅",
  tomato: "🍅",
  potato: "🥔",
};
