// Real Cashfree PG order creation (SPEC.md §5.4 `escrow-pay`) - not built
// for the prototype (SPEC.md §9.5 "Sandbox if Easy Split is enabled, else
// mock"). Honesty rule (CLAUDE.md §5): a set key whose call fails 502s, it
// never quietly falls back to the mock - so this throws rather than
// silently returning a mock-shaped order. There is also no Cashfree
// checkout screen in the app yet for a real paymentSessionId to open.
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";
import type { CreateOrderInput } from "./types.ts";

export function createOrder(_input: CreateOrderInput): Promise<never> {
  requireEnv("CASHFREE_APP_ID");
  requireEnv("CASHFREE_SECRET_KEY");
  throw new AppError("PAYMENTS_UNAVAILABLE", 502, "Real Cashfree checkout is not built yet");
}
