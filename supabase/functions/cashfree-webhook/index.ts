// Cashfree's payment webhook (SPEC.md §5.4, §5.7, §9.2 Phase 4 "4.3") -
// verify_jwt = false (config.toml), no user JWT at all: Cashfree proves
// itself with a signed body instead (CLAUDE.md §5 "verify the Cashfree
// signature first (bad -> 401)"). In mock mode verifyWebhook refuses every
// request (there's no real Cashfree, and no secret to check a signature
// against) - escrow-pay is the only path that funds an escrow while the
// prototype has no sandbox key.
import { handle, json, AppError } from "../_shared/http.ts";
import { db } from "../_shared/db.ts";
import { CashfreeWebhookEvent } from "../_shared/domain/schemas/escrow.ts";
import { verifyWebhook } from "../_shared/integrations/cashfree/index.ts";
import { toPaise } from "../_shared/domain/money.ts";

Deno.serve(
  handle(async (req) => {
    const rawBody = await req.text();
    await verifyWebhook(rawBody, req.headers);

    const event = CashfreeWebhookEvent.parse(JSON.parse(rawBody));

    // Ignore every event type/status this endpoint doesn't act on (refunds,
    // failures, disputes) - a 200 with no state change, not an error, so
    // Cashfree doesn't retry a webhook we understood but had nothing to do
    // with.
    if (event.type !== "PAYMENT_SUCCESS_WEBHOOK" || event.data.payment.payment_status !== "SUCCESS") {
      return json({ ok: true, data: { ignored: true } });
    }

    const { error } = await db.rpc("fund_escrow", {
      p_order_id: event.data.order.order_id,
      p_payment_ref: String(event.data.payment.cf_payment_id),
      p_amount_paise: toPaise(event.data.payment.payment_amount),
    });
    // A non-2xx here tells Cashfree to retry the webhook - correct for a
    // genuine outage, and harmless for ESCROW_NOT_FOUND/AMOUNT_MISMATCH
    // (our bug or a tampered order): fund_escrow is idempotent, so a retry
    // that does succeed later still writes only one Khata row.
    if (error) throw new AppError("INTERNAL", 500, error.message);

    return json({ ok: true, data: {} });
  }),
);
