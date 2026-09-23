// Turns a DELIVERED escrow into RELEASED + payouts + a green Khata row
// (SPEC.md §5.3, §5.4, §5.7, §9.2 Phase 4 "4.8"). A shared module, not a
// deployed Edge Function - SPEC's own `escrow-release` row has no HTTP
// caller of its own, only other server-side code (`trip`'s `POST /otp`
// today, 4.9's `cron-auto-settle` next), so there's no reason to add a
// network hop and a second internal secret just to reach it.
import { db } from "./db.ts";
import { rpcAppError } from "./http.ts";
import { splitRelease } from "./domain/split.ts";
import { releaseSplit } from "./integrations/cashfree/index.ts";
import type { Database } from "./database.types.ts";

type Escrow = Database["public"]["Tables"]["escrows"]["Row"];

/**
 * Releases the escrow for a single-lot deal. Calls Cashfree's split
 * first, the database second: in real mode a failed split call throws
 * before any row changes, so the escrow stays DELIVERED (CLAUDE.md §5
 * "Money (fail closed)") instead of moving to RELEASED with no real
 * payout behind it.
 *
 * ponytail: real Easy Split would also need `pending` -> `paid` payout
 * rows and a reconcile step once Cashfree confirms each transfer - the
 * mock always succeeds immediately, so `release_escrow()` writes every
 * payout as already `paid`. Upgrade path: split.ts's lines stay the same,
 * only the payout status/reconcile step changes.
 */
export async function releaseEscrow(escrowId: string, reason: string): Promise<Escrow> {
  const { data: escrow, error: escrowError } = await db
    .from("escrows")
    .select("*")
    .eq("id", escrowId)
    .single();
  if (escrowError || !escrow) throw rpcAppError("ESCROW_NOT_FOUND");

  // Already released - the OTP path and 4.9's 24h timer can both reach
  // here for the same escrow. Nothing to send to Cashfree twice.
  if (escrow.state === "RELEASED") return escrow;

  const { data: deal, error: dealError } = await db
    .from("deals")
    .select("lot_id, fee_paise, quantity_kg")
    .eq("id", escrow.deal_id)
    .single();
  if (dealError || !deal) throw rpcAppError("ESCROW_NOT_FOUND");

  // ponytail: same gap fund_escrow()/mark_dispatched()/record_pod() all
  // carry - no mega-lot deal has ever reached DELIVERED yet (3.4/3.5's
  // still-open gap). Upgrade path: split.ts already takes a farmers[]
  // array - build one line per mega_lot_items farmer instead of one.
  if (!deal.lot_id) throw rpcAppError("NOT_IMPLEMENTED mega_lot_deal");

  const { data: lot, error: lotError } = await db
    .from("lots")
    .select("farmer_id")
    .eq("id", deal.lot_id)
    .single();
  if (lotError || !lot) throw rpcAppError("ESCROW_NOT_FOUND");

  const lines = splitRelease({
    escrowTotalPaise: escrow.total_paise,
    feePaise: deal.fee_paise,
    farmers: [{ farmerId: lot.farmer_id, quantityKg: deal.quantity_kg }],
  });

  const split = await releaseSplit({ orderId: escrow.cashfree_order_id ?? escrow.id, lines });

  const { data: released, error: rpcError } = await db.rpc("release_escrow", {
    p_escrow: escrowId,
    p_reason: reason,
    p_payouts: lines,
    p_provider_ref: split.providerRef,
  });
  if (rpcError || !released) throw rpcAppError(rpcError?.message);

  return released;
}
