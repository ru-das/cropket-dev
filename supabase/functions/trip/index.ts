// The driver's own page, `/t/:token`, calls only this function (SPEC.md
// §4.16, §5.3, §5.4, §5.6, §5.7, §9.2 Phase 4 "4.7"). No user JWT at all -
// the driver has no account (CLAUDE.md §3 "the driver never talks to
// Supabase directly") - the trip token in the path is the only proof of
// who's calling, checked on every call the same way (CLAUDE.md §7 Learned
// Rules: `requireCronSecret()`-style, but the secret here is per-shipment,
// not global).
//
// One small router, three routes (SPEC §5.4 lists five - weigh/start/
// locations are Phase 5's full driver checklist, P1, out of prototype
// scope, SPEC.md §9.5):
//   GET  /trip/:token       -> {vehicleNumber, crop, quantityKg, state}
//   POST /trip/:token/pod   -> delivery photo, IN_TRANSIT -> DELIVERED
//   POST /trip/:token/otp   -> buyer's code, checked against OTP_PEPPER
//
// ponytail: no tripQueue here - the photo and the code both need internet
// on the driver page today (AGENTS.md §4 offline table already says so for
// OTP; the photo joins it because there's no offline queue to put it in
// yet). Upgrade path: Dexie's tripQueue (SPEC §5.8) + a background sync
// runner, same shape offline/outbox.ts already has for the farmer side.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireEnv } from "../_shared/env.ts";
import { db } from "../_shared/db.ts";
import {
  TripStateResult,
  PodInput,
  PodResult,
  OtpSubmitInput,
  OtpSubmitResult,
} from "../_shared/domain/schemas/shipment.ts";
import { hashTripToken } from "../_shared/domain/tripToken.ts";
import { deliveryOtp } from "../_shared/domain/deliveryOtp.ts";

const MAX_PHOTO_BYTES = 1024 * 1024;

type ShipmentContext = {
  shipmentId: string;
  dealId: string;
  escrowId: string;
  escrowState: string;
  vehicleNumber: string;
  crop: string;
  quantityKg: number;
};

// Same error for "no such token", "expired" and "wrong shape" - a probe
// can't tell them apart, same reasoning every other function's ownership
// check in this codebase gives. Never logs the token (see http.ts's
// fnNameFromUrl fix for the other half of that rule).
async function loadShipment(token: string): Promise<ShipmentContext> {
  const tokenHash = await hashTripToken(token);
  const { data: shipment, error: shipmentError } = await db
    .from("shipments")
    .select("id, deal_id, vehicle_number, token_expires_at")
    .eq("trip_token_hash", tokenHash)
    .single();
  if (shipmentError || !shipment || new Date(shipment.token_expires_at) <= new Date()) {
    throw new AppError("TRIP_NOT_FOUND", 404);
  }

  const { data: deal, error: dealError } = await db
    .from("deals")
    .select("id, lot_id, quantity_kg")
    .eq("id", shipment.deal_id)
    .single();
  if (dealError || !deal) throw new AppError("TRIP_NOT_FOUND", 404);

  const { data: escrow, error: escrowError } = await db
    .from("escrows")
    .select("id, state")
    .eq("deal_id", deal.id)
    .single();
  if (escrowError || !escrow) throw new AppError("TRIP_NOT_FOUND", 404);

  const { data: lot, error: lotError } = await db.from("lots").select("crop").eq("id", deal.lot_id).single();
  if (lotError || !lot) throw new AppError("TRIP_NOT_FOUND", 404);

  return {
    shipmentId: shipment.id,
    dealId: deal.id,
    escrowId: escrow.id,
    escrowState: escrow.state,
    vehicleNumber: shipment.vehicle_number,
    crop: lot.crop,
    quantityKg: deal.quantity_kg,
  };
}

// A Postgres function's raised text is "CODE extra words" (AGENTS.md §5) -
// escrow-pay/cashfree-webhook collapse every RPC error to INTERNAL because
// their own checks already rule out the specific ones; record_pod/
// record_otp_attempt don't have that luxury here (the driver's own page
// state can be stale after a network blip), so the real code reaches the
// driver as a translatable messageKey instead of a blank "something went
// wrong".
function rpcAppError(message: string | undefined): AppError {
  const code = (message ?? "").trim().split(/\s/)[0] || "INTERNAL";
  const status =
    code === "ESCROW_WRONG_STATE" || code === "OTP_LOCKED"
      ? 409
      : code === "SHIPMENT_NOT_FOUND" || code === "ESCROW_NOT_FOUND"
        ? 404
        : 500;
  return new AppError(code, status, message);
}

async function handleGet(ctx: ShipmentContext) {
  return json({
    ok: true,
    data: TripStateResult.parse({
      vehicleNumber: ctx.vehicleNumber,
      crop: ctx.crop,
      quantityKg: ctx.quantityKg,
      state: ctx.escrowState,
    }),
  });
}

async function handlePod(req: Request, ctx: ShipmentContext) {
  const form = await req.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) throw new AppError("VALIDATION_FAILED", 400);
  if (!photo.type.startsWith("image/")) throw new AppError("VALIDATION_FAILED", 400);
  if (photo.size > MAX_PHOTO_BYTES) throw new AppError("VALIDATION_FAILED", 400);

  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" && value !== "" ? value : undefined;
  };
  const input = PodInput.parse({ lat: field("lat"), lng: field("lng"), takenAt: field("takenAt") });

  const path = `${ctx.shipmentId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await db.storage.from("pod").upload(path, photo, { contentType: photo.type });
  if (uploadError) throw new AppError("UPLOAD_FAILED", 502, uploadError.message);

  const { data: escrow, error: rpcError } = await db.rpc("record_pod", {
    p_shipment_id: ctx.shipmentId,
    p_photo_path: path,
    p_lat: input.lat ?? null,
    p_lng: input.lng ?? null,
    p_taken_at: input.takenAt,
  });
  if (rpcError || !escrow) throw rpcAppError(rpcError?.message);

  return json({
    ok: true,
    data: PodResult.parse({ state: escrow.state, autoReleaseAt: escrow.auto_release_at }),
  });
}

async function handleOtp(req: Request, ctx: ShipmentContext) {
  const input = OtpSubmitInput.parse(await req.json());
  const expected = await deliveryOtp(requireEnv("OTP_PEPPER"), ctx.escrowId);
  const correct = input.otp === expected;

  // A locked escrow throws OTP_LOCKED here, which reaches the driver as a
  // normal 409 - and, via handle()'s own log line, is exactly the "admin
  // alerted" event 4.5's record_otp_attempt() deferred to this call.
  const { data: triesLeft, error: rpcError } = await db.rpc("record_otp_attempt", {
    p_escrow: ctx.escrowId,
    p_correct: correct,
  });
  if (rpcError || triesLeft === null) throw rpcAppError(rpcError?.message);

  // ponytail: a correct code just reports itself here - it doesn't call
  // escrow-release yet (that's 4.8; today's escrow sits in DELIVERED
  // until 4.8 or 4.9's 24h timer moves it on).
  return json({ ok: true, data: OtpSubmitResult.parse({ correct, triesLeft }) });
}

Deno.serve(
  handle(async (req) => {
    const segments = new URL(req.url).pathname.split("/").filter(Boolean);
    const tripIndex = segments.indexOf("trip");
    const token = segments[tripIndex + 1];
    const subroute = segments[tripIndex + 2];
    if (!token) throw new AppError("TRIP_NOT_FOUND", 404);

    const ctx = await loadShipment(token);

    if (req.method === "GET" && !subroute) return handleGet(ctx);
    if (req.method === "POST" && subroute === "pod") return handlePod(req, ctx);
    if (req.method === "POST" && subroute === "otp") return handleOtp(req, ctx);
    throw new AppError("NOT_FOUND", 404);
  }),
);
