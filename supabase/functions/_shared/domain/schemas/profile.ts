// Shapes for a `profiles` row (SPEC.md §5.6) and the login/onboarding
// inputs. Pure TypeScript + zod only (CLAUDE.md §4 "shared domain code") -
// used by the app and, later, by Edge Functions that touch profiles.
import { z } from "zod";
import { Crop } from "../crops.ts";
import { LatLng } from "../geo.ts";

export const Role = z.enum(["farmer", "buyer", "fpo", "admin", "nbfc"]);
export type Role = z.infer<typeof Role>;

// Only these three can be picked at onboarding (SPEC.md §4.3) - admin and
// nbfc accounts are made by the team by hand.
export const SignupRole = z.enum(["farmer", "buyer", "fpo"]);
export type SignupRole = z.infer<typeof SignupRole>;

// A 10-digit Indian mobile number, no +91, no spaces - what the login form
// collects, and also what cropket-dev's Supabase test phone numbers are
// keyed by (checked directly against the project: the test OTP allowlist
// matches the exact string sent to auth, and that string is the bare
// 10-digit number, not E.164 - "+91" in the UI is a display-only prefix).
// First digit 6-9 per TRAI numbering.
export const Phone10 = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number");
export type Phone10 = z.infer<typeof Phone10>;

// Chat-style onboarding (1.1, SPEC.md §4.3): role and name for everyone,
// then village + GPS for everyone and crops only for farmer/FPO (a buyer
// doesn't grow anything - SPEC.md §9.2 Phase 1 table). `location` is
// nullable because GPS can be denied or time out; the screen still lets the
// farmer finish (SPEC.md §6.7 "advisory, never blocks").
export const ProfileInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    role: SignupRole,
    village: z.string().trim().min(1).max(80),
    crops: z.array(Crop).default([]),
    location: LatLng.nullable().default(null),
  })
  .refine((input) => input.role === "buyer" || input.crops.length > 0, {
    message: "Pick at least one crop",
    path: ["crops"],
  });
export type ProfileInput = z.infer<typeof ProfileInput>;
