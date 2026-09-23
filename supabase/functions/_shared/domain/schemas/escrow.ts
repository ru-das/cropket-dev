// Shapes for `escrow-pay`, `cashfree-webhook` (SPEC.md §4.14, §5.4, §9.2
// Phase 4 "4.3") and the `integrations/cashfree` adapter. Pure TypeScript +
// zod only (CLAUDE.md §4 "shared domain code").
import { z } from "zod";

export const EscrowPayInput = z.object({ escrowId: z.uuid() });
export type EscrowPayInput = z.infer<typeof EscrowPayInput>;

// `source` so both integrations/cashfree/mock.ts and real.ts are validated
// against the same schema (CLAUDE.md §5 "validate results with zod in both
// mock and real mode"). `paymentSessionId` is null in mock mode - there is
// no checkout to open, escrow-pay already funded the escrow itself.
export const EscrowPayResult = z.object({
  state: z.string(),
  source: z.enum(["mock", "cashfree"]),
  paymentSessionId: z.string().nullable(),
});
export type EscrowPayResult = z.infer<typeof EscrowPayResult>;

export const CashfreeOrder = z.object({
  orderId: z.string(),
  paymentSessionId: z.string().nullable(),
  source: z.enum(["mock", "cashfree"]),
});
export type CashfreeOrder = z.infer<typeof CashfreeOrder>;

// Only the fields cashfree-webhook actually reads, from Cashfree's PG v2
// webhook payload shape - not the whole envelope Cashfree sends.
export const CashfreeWebhookEvent = z.object({
  type: z.string(),
  data: z.object({
    order: z.object({ order_id: z.string() }),
    payment: z.object({
      cf_payment_id: z.union([z.string(), z.number()]),
      payment_status: z.string(),
      payment_amount: z.number(),
    }),
  }),
});
export type CashfreeWebhookEvent = z.infer<typeof CashfreeWebhookEvent>;
