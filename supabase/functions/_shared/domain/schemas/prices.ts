// Shapes for one mandi/crop/day price row (SPEC.md §5.6 `mandi_prices`),
// shared by `cron-fetch-prices` (2.3) and its `integrations/agmarknet`
// adapter (both mock.ts and real.ts return this exact shape - CLAUDE.md §5
// "validate results with zod in both mock and real mode"). Pure TypeScript
// + zod only (CLAUDE.md §4 "shared domain code").
import { z } from "zod";
import { Crop } from "../crops.ts";

// A generic UUID shape, not zod's stricter `z.uuid()` (RFC version/variant
// nibbles only). `mandis.id` is a Postgres `uuid` column but the seeded rows
// are hand-typed ids like "10000000-0000-0000-0000-000000000001" for
// readability (supabase/seed.sql) - valid to Postgres, but `z.uuid()`
// rejects them. This is the same trust boundary (well-formed id, nothing
// more), just as permissive as the database column it mirrors.
const uuidShape = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

// `arrivalsTonnes` is nullable: data.gov.in's daily-price resource has no
// arrivals column at all, and the separate Agmarknet arrivals lookup can
// fail or simply have nothing for a market that day. A real price with
// unknown arrivals is stored as-is - never guessed - so `mandi_heat` (2.3's
// migration) just skips that mandi/crop/day rather than showing a colour
// backed by a made-up number (CLAUDE.md §5 honesty rule).
export const DailyPrice = z
  .object({
    mandiId: uuidShape,
    crop: Crop,
    date: z.iso.date(),
    minPricePaise: z.number().int().min(0),
    maxPricePaise: z.number().int().min(0),
    modalPricePaise: z.number().int().min(0),
    arrivalsTonnes: z.number().min(0).nullable(),
    source: z.enum(["agmarknet", "mock"]),
  })
  .refine((row) => row.minPricePaise <= row.modalPricePaise && row.modalPricePaise <= row.maxPricePaise, {
    message: "min_price must be <= modal_price <= max_price",
  });
export type DailyPrice = z.infer<typeof DailyPrice>;
