// The only file other code imports for payments (SPEC.md §2.2). Picks mock
// or real and validates every order against CashfreeOrder either way
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
import { CashfreeOrder, CashfreeSplit } from "../../domain/schemas/escrow.ts";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";
import { cashfreeSignature } from "./signature.ts";
import type { CreateOrderInput, ReleaseSplitInput } from "./types.ts";

export type { CreateOrderInput, ReleaseSplitInput };

export async function createOrder(input: CreateOrderInput): Promise<CashfreeOrder> {
  const impl = isMock("cashfree", ["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"]) ? mock : real;
  return CashfreeOrder.parse(await impl.createOrder(input));
}

export async function releaseSplit(input: ReleaseSplitInput): Promise<CashfreeSplit> {
  const impl = isMock("cashfree", ["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"]) ? mock : real;
  return CashfreeSplit.parse(await impl.releaseSplit(input));
}

// cashfree-webhook's first line of defence (CLAUDE.md §5 "verify the
// Cashfree signature first (bad -> 401)"). In mock mode there is no secret
// to check a signature against, and no real Cashfree will ever call this
// endpoint - every request is refused, fail closed, same reasoning
// digilocker/real.ts's honesty rule follows for a missing/unbuilt real
// path. Cashfree's own header names: x-webhook-timestamp + x-webhook-signature.
export async function verifyWebhook(rawBody: string, headers: Headers): Promise<void> {
  if (isMock("cashfree", ["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"])) {
    throw new AppError("WEBHOOK_SIGNATURE_INVALID", 401);
  }
  const timestamp = headers.get("x-webhook-timestamp") ?? "";
  const signature = headers.get("x-webhook-signature") ?? "";
  if (!timestamp || !signature) throw new AppError("WEBHOOK_SIGNATURE_INVALID", 401);

  const expected = await cashfreeSignature(requireEnv("CASHFREE_SECRET_KEY"), timestamp, rawBody);
  if (expected !== signature) throw new AppError("WEBHOOK_SIGNATURE_INVALID", 401);
}
