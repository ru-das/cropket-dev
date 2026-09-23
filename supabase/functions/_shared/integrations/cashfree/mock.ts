// Stand-in for Cashfree order creation (SPEC.md §9.5 "Payments | Mock
// Cashfree"). No checkout session to open - escrow-pay funds the escrow
// itself right after this returns (see escrow-pay/index.ts), so there is
// nothing for the buyer to be redirected to.
import type { CashfreeOrder } from "../../domain/schemas/escrow.ts";
import type { CreateOrderInput } from "./types.ts";

export function createOrder(input: CreateOrderInput): Promise<CashfreeOrder> {
  return Promise.resolve({ orderId: input.orderId, paymentSessionId: null, source: "mock" });
}
