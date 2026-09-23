// Gives the buyer their deal's delivery code (SPEC.md §4.14, §5.4, §9.2
// Phase 4 "4.5"). Thin by design (CLAUDE.md §4) - the code isn't looked
// up, it's derived (`_shared/domain/deliveryOtp.ts`), so this function's
// only job is checking the caller owns the deal and the escrow is far
// enough along to have a code to give at all.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { requireEnv } from "../_shared/env.ts";
import { db } from "../_shared/db.ts";
import { DeliveryCodeInput, DeliveryCodeResult } from "../_shared/domain/schemas/escrow.ts";
import { deliveryOtp } from "../_shared/domain/deliveryOtp.ts";

// States from FUNDED onward - before FUNDED there's no delivery to speak
// of yet, and RELEASED/PARTIAL_RELEASED/REFUNDED/CANCELLED/DISPUTED mean
// the code has already served its purpose or the deal took a different
// path (SPEC §5.7).
const CODE_VISIBLE_STATES = new Set(["FUNDED", "DRIVER_ADVANCE_PAID", "IN_TRANSIT", "DELIVERED"]);

Deno.serve(
  handle(async (req) => {
    const user = await requireRole(req, ["buyer"]);
    const input = DeliveryCodeInput.parse(await req.json());

    const { data: escrow, error: escrowError } = await db
      .from("escrows")
      .select("id, deal_id, state")
      .eq("id", input.escrowId)
      .single();
    if (escrowError || !escrow) throw new AppError("ESCROW_NOT_FOUND", 404);

    const { data: deal, error: dealError } = await db
      .from("deals")
      .select("buyer_id")
      .eq("id", escrow.deal_id)
      .single();
    // Same error for "no such escrow" and "not yours" - a probe can't tell
    // them apart, same reasoning escrow-pay/accept_bid give.
    if (dealError || !deal || deal.buyer_id !== user.id) throw new AppError("ESCROW_NOT_FOUND", 404);

    if (!CODE_VISIBLE_STATES.has(escrow.state)) throw new AppError("ESCROW_WRONG_STATE", 409);

    const code = await deliveryOtp(requireEnv("OTP_PEPPER"), escrow.id);
    // Never logged - the code is the same secret the driver will be given.
    return json({ ok: true, data: DeliveryCodeResult.parse({ code }) });
  }),
);
