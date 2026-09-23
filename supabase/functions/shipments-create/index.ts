// Makes (or remakes) a driver trip link (SPEC.md §4.14, §4.16, §5.4, §5.6,
// §9.2 Phase 4 "4.7"). Called by the farmer's `DriverLinkCard` once the
// escrow reaches IN_TRANSIT (4.6's "Mark dispatched"). Thin by design
// (CLAUDE.md §4) - the token itself is `_shared/domain/tripToken.ts`, same
// split escrow-pay/delivery-code already use.
//
// No SMS is actually sent (CLAUDE.md §1 "Driver SMS: link shown on
// screen") - the link is returned once, in this response, and never
// stored anywhere in plaintext (only its hash). A second call for the
// same deal makes a brand new token and overwrites the old hash, so the
// old link stops working - the farmer's own "Make a new link" button.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { getEnv } from "../_shared/env.ts";
import { db } from "../_shared/db.ts";
import { ShipmentCreateInput, ShipmentCreateResult } from "../_shared/domain/schemas/shipment.ts";
import { newTripToken, hashTripToken } from "../_shared/domain/tripToken.ts";

const TOKEN_TTL_HOURS = 72;

Deno.serve(
  handle(async (req) => {
    const user = await requireRole(req, ["farmer"]);
    const input = ShipmentCreateInput.parse(await req.json());

    const { data: deal, error: dealError } = await db
      .from("deals")
      .select("id, lot_id")
      .eq("id", input.dealId)
      .single();
    if (dealError || !deal) throw new AppError("DEAL_NOT_FOUND", 404);

    // Same error for "no such deal", "not yours" and "this deal has no
    // single owning lot" (a mega-lot deal, lot_id null) - a probe can't
    // tell them apart, same reasoning mark_dispatched()'s ESCROW_NOT_FOUND
    // gives. Two queries, not an embedded-resource filter - matches every
    // other function's ownership check in this codebase (escrow-pay,
    // delivery-code, mark_dispatched).
    const owned =
      deal.lot_id !== null &&
      (await db.from("lots").select("id").eq("id", deal.lot_id).eq("farmer_id", user.id).maybeSingle()).data;
    if (!owned) throw new AppError("DEAL_NOT_FOUND", 404);

    const { data: escrow, error: escrowError } = await db
      .from("escrows")
      .select("id, state")
      .eq("deal_id", deal.id)
      .single();
    if (escrowError || !escrow) throw new AppError("ESCROW_NOT_FOUND", 404);
    if (escrow.state !== "IN_TRANSIT") throw new AppError("ESCROW_WRONG_STATE", 409);

    const token = newTripToken();
    const tokenHash = await hashTripToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

    // One shipment per deal (SPEC §5.6) - a repeat call rotates the same
    // row's token instead of inserting a second one.
    const { data: shipment, error: upsertError } = await db
      .from("shipments")
      .upsert(
        {
          deal_id: deal.id,
          driver_phone: input.driverPhone,
          vehicle_number: input.vehicleNumber,
          trip_token_hash: tokenHash,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "deal_id" },
      )
      .select("id")
      .single();
    if (upsertError || !shipment) throw new AppError("INTERNAL", 500, upsertError?.message);

    // APP_URL is optional (§7.2) - the request's own Origin is a fine
    // fallback in dev, where the web app and the functions are called
    // from the same place anyway.
    const appUrl = getEnv("APP_URL") || req.headers.get("origin") || "";
    if (!appUrl) throw new AppError("SETUP_MISSING_KEY", 500, "SETUP_MISSING_KEY APP_URL");
    const tripUrl = `${appUrl.replace(/\/$/, "")}/t/${token}`;

    return json({
      ok: true,
      data: ShipmentCreateResult.parse({ shipmentId: shipment.id, tripUrl, source: "mock" }),
    });
  }),
);
