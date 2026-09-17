// Which questions onboarding asks, and in what order (SPEC.md §4.3 chat-style
// onboarding, decided with the user for 1.1): farmer and FPO answer four
// questions (role, name, village + GPS, crops); a buyer stops after three -
// a buyer doesn't grow anything, so the crop question is dropped for them.
// Pure logic, no React, so OnboardingPage.tsx just renders whatever this
// returns (CLAUDE.md §4 "small files, small functions").
import type { SignupRole } from "@shared/schemas/profile.ts";

export type StepId = "role" | "name" | "place" | "crops";

const FARMER_STEPS: StepId[] = ["role", "name", "place", "crops"];
const BUYER_STEPS: StepId[] = ["role", "name", "place"];

/**
 * The step list for a role. Before a role is picked (`role` is `null`) this
 * returns the longer, farmer/FPO list, so the header can already show
 * "1 of 4" - it only shortens to "of 3" once the person taps Buyer.
 */
export function stepsFor(role: SignupRole | null): StepId[] {
  return role === "buyer" ? BUYER_STEPS : FARMER_STEPS;
}
