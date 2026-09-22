// The only file other code imports for buyer KYC (SPEC.md §2.2). Picks
// mock or real and validates the result against KycResult either way
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
import { KycResult } from "../../domain/schemas/kyc.ts";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";
import type { KycCheckInput } from "./types.ts";

export type { KycCheckInput };

export async function checkKyc(input: KycCheckInput): Promise<KycResult> {
  const impl = isMock("digilocker", ["DIGILOCKER_API_KEY"]) ? mock : real;
  return KycResult.parse(await impl.checkKyc(input));
}
