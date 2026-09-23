// Stand-in for Cashfree order creation (SPEC.md §9.5 "Payments | Mock
// Cashfree"). No checkout session to open - escrow-pay funds the escrow
// itself right after this returns (see escrow-pay/index.ts), so there is
// nothing for the buyer to be redirected to.
import type { CashfreeOrder, CashfreeSplit } from "../../domain/schemas/escrow.ts";
import type { CreateOrderInput, ReleaseSplitInput } from "./types.ts";

export function createOrder(input: CreateOrderInput): Promise<CashfreeOrder> {
  return Promise.resolve({ orderId: input.orderId, paymentSessionId: null, source: "mock" });
}

// Stand-in for Cashfree Easy Split's release call (SPEC.md §9.5 "Payments |
// Mock Cashfree", §5.4, §9.2 Phase 4 "4.8") - release_escrow() (the SQL
// function) is what actually writes the payouts rows; this just gives
// release.ts a provider_ref to store on them.
export function releaseSplit(input: ReleaseSplitInput): Promise<CashfreeSplit> {
  return Promise.resolve({ providerRef: `mock_${input.orderId}`, source: "mock" });
}
