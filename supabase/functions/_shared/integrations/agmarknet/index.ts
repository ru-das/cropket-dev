// The only file other code imports for mandi prices (SPEC.md §2.2). Picks
// mock or real and validates every row against DailyPrice either way
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
import { DailyPrice } from "../../domain/schemas/prices.ts";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";
import type { FetchPricesInput, FetchPricesResult } from "./types.ts";

export type { FetchPricesInput, FetchPricesResult, LateArrival, MandiInput } from "./types.ts";

export async function fetchPrices(input: FetchPricesInput): Promise<FetchPricesResult> {
  const impl = isMock("agmarknet", ["DATA_GOV_API_KEY", "AGMARKNET_RESOURCE_ID"]) ? mock : real;
  const result = await impl.fetchPrices(input);
  const prices = result.prices.filter((row): row is DailyPrice => DailyPrice.safeParse(row).success);
  return { prices, lateArrivals: result.lateArrivals };
}
