// Buyer pays for a deal (SPEC.md §4.14, §5.4, §9.2 Phase 4 "4.3"). Called
// by the buyer's "Pay and lock money" button (app/src/services/escrow.ts).
// Thin by design (CLAUDE.md §4) - the payment itself is
// integrations/cashfree, and in mock mode this function is also the only
// caller of fund_escrow() a browser can reach (cashfree-webhook refuses
// every request when there's no real Cashfree to sign one, see
// integrations/cashfree/index.ts's verifyWebhook).
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { EscrowPayInput, EscrowPayResult } from "../_shared/domain/schemas/escrow.ts";
import { createOrder } from "../_shared/integrations/cashfree/index.ts";

Deno.serve(
  handle(async (req) => {
    const user = await requireRole(req, ["buyer"]);
    const input = EscrowPayInput.parse(await req.json());

    const { data: escrow, error: escrowError } = await db
      .from("escrows")
      .select("id, deal_id, state, total_paise, cashfree_order_id")
      .eq("id", input.escrowId)
      .single();
    if (escrowError || !escrow) throw new AppError("ESCROW_NOT_FOUND", 404);

    const { data: deal, error: dealError } = await db
      .from("deals")
      .select("buyer_id")
      .eq("id", escrow.deal_id)
      .single();
    // Same error for "no such escrow" and "not yours" - a probe can't tell
    // them apart, same reasoning lot_bids()/accept_bid give.
    if (dealError || !deal || deal.buyer_id !== user.id) throw new AppError("ESCROW_NOT_FOUND", 404);

    // Idempotent: a second tap (or a retry after the first response never
    // arrived) does no harm - it just reports the state fund_escrow already
    // reached.
    if (escrow.state !== "CREATED") {
      return json({
        ok: true,
        data: EscrowPayResult.parse({ state: escrow.state, source: "mock", paymentSessionId: null }),
      });
    }

    const orderId = escrow.cashfree_order_id ?? escrow.id;
    if (!escrow.cashfree_order_id) {
      const { error: orderIdError } = await db
        .from("escrows")
        .update({ cashfree_order_id: orderId })
        .eq("id", escrow.id);
      if (orderIdError) throw new AppError("INTERNAL", 500, orderIdError.message);
    }

    const order = await createOrder({ orderId, amountPaise: escrow.total_paise, customerId: user.id });

    if (order.source === "mock") {
      const { data: funded, error: fundError } = await db.rpc("fund_escrow", {
        p_order_id: orderId,
        p_payment_ref: "mock_" + orderId,
        p_amount_paise: escrow.total_paise,
      });
      if (fundError || !funded) throw new AppError("INTERNAL", 500, fundError?.message);
      return json({
        ok: true,
        data: EscrowPayResult.parse({ state: funded.state, source: "mock", paymentSessionId: null }),
      });
    }

    return json({
      ok: true,
      data: EscrowPayResult.parse({
        state: escrow.state,
        source: "cashfree",
        paymentSessionId: order.paymentSessionId,
      }),
    });
  }),
);
