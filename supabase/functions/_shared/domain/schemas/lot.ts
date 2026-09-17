// Shapes for a `lots` row (SPEC.md §5.6) and the create-lot input the app
// queues in the outbox (SPEC.md §5.8, §9.2 Phase 1 "1.6"). Pure TypeScript +
// zod only (CLAUDE.md §4 "shared domain code") - the app validates with this
// before enqueue() and again before the insert, so a bad payload can never
// reach the server no matter how long it sat in the outbox.
import { z } from "zod";
import { Crop } from "../crops.ts";
import { LatLng } from "../geo.ts";
import { Grade } from "./grade.ts";

// Matches the `lot_status` enum created in the lots migration.
export const LotStatus = z.enum([
  "draft",
  "listed",
  "in_mega",
  "sold",
  "in_transit",
  "delivered",
  "rescued",
  "salvage",
]);
export type LotStatus = z.infer<typeof LotStatus>;

// What NewLotPage builds and saveLot() queues (app/src/services/lots.ts).
// `id` is made on the phone (SPEC.md §5.6) - it's also the outbox item's id,
// so re-queuing a failed save never creates a second lot. `location` is
// nullable because GPS can be denied or time out (SPEC.md §6.7 "advisory,
// never blocks") - the farmer can still save the lot.
export const LotInput = z.object({
  id: z.uuid(),
  crop: Crop,
  quantityKg: z.number().int().min(1).max(100_000),
  gradeResultId: z.uuid().nullable(),
  grade: Grade.nullable(),
  location: LatLng.nullable(),
  clientCreatedAt: z.iso.datetime(),
});
export type LotInput = z.infer<typeof LotInput>;
