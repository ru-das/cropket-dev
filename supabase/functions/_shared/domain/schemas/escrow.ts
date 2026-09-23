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
// `delivery-code` (SPEC §4.14, §5.4, §9.2 Phase 4 "4.5"). The code itself
// is never stored - see `_shared/domain/deliveryOtp.ts`.
export const DeliveryCodeInput = z.object({ escrowId: z.uuid() });
export type DeliveryCodeInput = z.infer<typeof DeliveryCodeInput>;

export const DeliveryCodeResult = z.object({ code: z.string().regex(/^\d{4}$/) });
export type DeliveryCodeResult = z.infer<typeof DeliveryCodeResult>;

// mark_dispatched (SPEC §5.3, §9.2 Phase 4 "4.6") - called directly with
// supabase.rpc(), not an Edge Function, but the input still gets a shared
// schema like every other money/trading call (CLAUDE.md §4).
export const MarkDispatchedInput = z.object({ escrowId: z.uuid() });
export type MarkDispatchedInput = z.infer<typeof MarkDispatchedInput>;

// The cashfree adapter's release-split call (SPEC §5.4/§5.7, §9.2 Phase 4
// "4.8") - validated in both mock and real mode, same reasoning
// CashfreeOrder gives. `providerRef` is stored on every `payouts` row it
// produces.
export const CashfreeSplit = z.object({
  providerRef: z.string(),
  source: z.enum(["mock", "cashfree"]),
});
export type CashfreeSplit = z.infer<typeof CashfreeSplit>;

// cron-auto-settle's own result (SPEC §5.2, §9.2 Phase 4 "4.9") - how many
// DELIVERED-past-timer escrows it released this run, and how many it tried
// and skipped (still DELIVERED, retried next run - see _shared/release.ts's
// per-escrow isolation).
export const AutoSettleResult = z.object({
  released: z.int().nonnegative(),
  failed: z.int().nonnegative(),
});
export type AutoSettleResult = z.infer<typeof AutoSettleResult>;

// escrow-skip-timer (admin, DEMO_MODE only - SPEC §5.2, §8.6, §9.2 Phase 4
// "4.9"): sets a DELIVERED escrow's timer to now and releases it in the
// same request.
export const SkipTimerInput = z.object({ escrowId: z.uuid() });
export type SkipTimerInput = z.infer<typeof SkipTimerInput>;

export const SkipTimerResult = z.object({
  state: z.string(),
  autoReleaseAt: z.iso.datetime({ offset: true }),
});
export type SkipTimerResult = z.infer<typeof SkipTimerResult>;

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
