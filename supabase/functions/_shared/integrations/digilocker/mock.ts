// Stand-in for a DigiLocker / GST lookup (SPEC.md §9.5 "Buyer KYC | Mock").
// Deterministic verify rule decided with the user: a real GSTIN's chars
// 3-12 are the holder's PAN, so a matching PAN verifies instantly and a
// mismatched one goes to the admin queue - demos both paths without
// inventing a rule that isn't grounded in the real document shape.
import type { KycResult } from "../../domain/schemas/kyc.ts";
import { panFromGstin } from "../../domain/schemas/kyc.ts";
import type { KycCheckInput } from "./types.ts";

export function checkKyc(input: KycCheckInput): Promise<KycResult> {
  const verified = panFromGstin(input.gstNumber) === input.pan;
  return Promise.resolve({ status: verified ? "verified" : "pending", source: "mock" });
}
