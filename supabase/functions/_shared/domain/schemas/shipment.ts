// Shapes for `shipments-create` and the `trip` function (SPEC.md §4.16,
// §5.4, §5.6, §9.2 Phase 4 "4.7"). Pure TypeScript + zod only (CLAUDE.md
// §4 "shared domain code"), same shape as escrow.ts.
import { z } from "zod";
import { Crop } from "../crops.ts";

// Same 10-digit Indian mobile shape the `shipments.driver_phone` check
// constraint already enforces (20260923220000_shipments.sql) - checked
// again here so a bad number never reaches the database at all.
const indianPhone = z.string().regex(/^[6-9][0-9]{9}$/);

// Normalises "mh15 ab 1234" / "MH-15-AB-1234" to "MH15AB1234" before
// checking the shape, so the farmer's own spacing/casing habits never
// matter. The shape itself is generic on purpose (2 letters, 1-2 digits,
// 1-3 letters, 4 digits) - it doesn't need to be a perfect RTO validator,
// only to catch a typo before it reaches a stranger's phone as a link.
const vehicleNumber = z.preprocess(
  (v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "") : v),
  z.string().regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/),
);

export const ShipmentCreateInput = z.object({
  dealId: z.uuid(),
  driverPhone: indianPhone,
  vehicleNumber,
});
export type ShipmentCreateInput = z.infer<typeof ShipmentCreateInput>;

export const ShipmentCreateResult = z.object({
  shipmentId: z.uuid(),
  tripUrl: z.url(),
  source: z.literal("mock"), // SMS is always mocked in the prototype (CLAUDE.md §1)
});
export type ShipmentCreateResult = z.infer<typeof ShipmentCreateResult>;

// `trip`'s GET /trip/:token (SPEC §5.4) - no prices, no phone numbers, no
// buyer/farmer name (the driver never needs them, same reasoning
// buyer_deals() withholds the farmer's phone).
export const TripStateResult = z.object({
  vehicleNumber: z.string(),
  crop: Crop,
  quantityKg: z.number().int().positive(),
  state: z.string(),
});
export type TripStateResult = z.infer<typeof TripStateResult>;

// POST /trip/:token/pod - multipart, so only the non-file fields are
// parsed with this schema; the photo itself is read from FormData
// directly (see trip/index.ts).
export const PodInput = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  takenAt: z.iso.datetime(),
});
export type PodInput = z.infer<typeof PodInput>;

export const PodResult = z.object({
  state: z.string(),
  // { offset: true } - this comes straight from Postgres via PostgREST as
  // "...+00:00", not the "...Z" shape a phone's own toISOString() makes
  // (that's what `takenAt` above is checked against instead).
  autoReleaseAt: z.iso.datetime({ offset: true }).nullable(),
});
export type PodResult = z.infer<typeof PodResult>;

// POST /trip/:token/otp
export const OtpSubmitInput = z.object({ otp: z.string().regex(/^\d{4}$/) });
export type OtpSubmitInput = z.infer<typeof OtpSubmitInput>;

export const OtpSubmitResult = z.object({
  correct: z.boolean(),
  triesLeft: z.number().int().min(0).max(5),
});
export type OtpSubmitResult = z.infer<typeof OtpSubmitResult>;
