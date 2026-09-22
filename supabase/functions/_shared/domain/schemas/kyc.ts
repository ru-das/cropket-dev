// Shapes for the `kyc-verify` Edge Function (SPEC.md §5.4, §9.2 Phase 3
// "3.1") and its `integrations/digilocker` adapter. Pure TypeScript + zod
// only (CLAUDE.md §4 "shared domain code").
import { z } from "zod";

// Standard 15-char GSTIN: 2-digit state code, 10-char PAN, 1-digit entity
// code, 'Z' by default, 1 checksum char.
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const KycRequest = z.object({
  businessName: z.string().trim().min(3).max(120),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_RE, "Enter a valid 15-character GSTIN"),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_RE, "Enter a valid 10-character PAN"),
});
export type KycRequest = z.infer<typeof KycRequest>;

// `source` so both integrations/digilocker/mock.ts and real.ts are
// validated against the same schema (CLAUDE.md §5 "validate results with
// zod in both mock and real mode").
export const KycResult = z.object({
  status: z.enum(["pending", "verified", "rejected"]),
  source: z.enum(["mock", "digilocker"]),
});
export type KycResult = z.infer<typeof KycResult>;

// A real GSTIN's characters 3-12 are the holder's PAN - the mock adapter's
// verify rule (decided with the user: deterministic, demos both the
// verified and pending paths, and is a real structural fact rather than
// invented magic).
export function panFromGstin(gstin: string): string {
  return gstin.slice(2, 12);
}
