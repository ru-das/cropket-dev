// Real DigiLocker / GST verification (SPEC.md §5.4 `kyc-verify`) - not
// built for the prototype (SPEC.md §9.5). Honesty rule (CLAUDE.md §5): a
// set key whose call fails 502s, it never quietly falls back to the mock -
// so this throws rather than silently returning a mock-shaped result.
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";
import type { KycCheckInput } from "./types.ts";

export function checkKyc(_input: KycCheckInput): Promise<never> {
  requireEnv("DIGILOCKER_API_KEY");
  throw new AppError("KYC_UNAVAILABLE", 502, "Real DigiLocker/GST verification is not built yet");
}
