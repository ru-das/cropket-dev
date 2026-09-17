// Calls the two real upstreams cron-fetch-prices (2.3) needs (SPEC.md §2.1,
// §5.4). See parse.ts for why there are two of them and what each returns.
//
// Honesty rule (CLAUDE.md §5): a set key whose real call fails must 502, not
// quietly fall back to mock. That only applies to the *price* call - the
// arrivals call has no key of its own to be "set", data.gov.in simply never
// promised arrivals, so a failed or empty arrivals lookup is a normal
// `null`, not an outage.
import type { Crop } from "../../domain/crops.ts";
import type { DailyPrice } from "../../domain/schemas/prices.ts";
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";
import {
  arrivalKey,
  cropToCommodityName,
  isoToDDMMYYYY,
  mergePricesWithArrivals,
  parseAgmarknetArrivalResponse,
  parseDataGovResponse,
} from "./parse.ts";
import type { FetchPricesInput } from "./types.ts";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
const AGMARKNET_DASHBOARD_URL = "https://api.agmarknet.gov.in/v1/dashboard-data/";

// SPEC.md §1: the prototype only onboards Nashik farmers, so these two
// Agmarknet ids are fixed constants, not a lookup table.
// ponytail: hardcoded to Nashik district (361) / Maharashtra state (20) -
// turn into a per-mandi lookup if the pilot ever covers a second district.
const MAHARASHTRA_STATE_ID = 20;
const NASHIK_DISTRICT_ID = 361;

async function fetchDataGovPrices(crop: Crop): Promise<unknown> {
  const apiKey = requireEnv("DATA_GOV_API_KEY");
  const resourceId = requireEnv("AGMARKNET_RESOURCE_ID");
  const url =
    `${DATA_GOV_BASE}/${resourceId}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=200` +
    `&filters[district.keyword]=Nashik&filters[commodity.keyword]=${cropToCommodityName(crop)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    throw new AppError("PRICES_UNAVAILABLE", 502, err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) throw new AppError("PRICES_UNAVAILABLE", 502, `data.gov.in returned ${res.status}`);
  return await res.json();
}

/** Best-effort - every failure (network, bad shape, no row for this crop) becomes `null`, never a thrown error. */
async function fetchAgmarknetArrival(marketId: number, date: string, crop: Crop): Promise<unknown> {
  const res = await fetch(AGMARKNET_DASHBOARD_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      dashboard: "marketwise_price_arrival",
      date: isoToDDMMYYYY(date),
      state: MAHARASHTRA_STATE_ID,
      district: [NASHIK_DISTRICT_ID],
      market: [marketId],
      format: "json",
      limit: 20,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchPrices(input: FetchPricesInput): Promise<DailyPrice[]> {
  const drafts = [];
  for (const crop of input.crops) {
    drafts.push(...parseDataGovResponse(await fetchDataGovPrices(crop), crop, input.mandis));
  }

  const arrivals = new Map<string, { date: string; tonnes: number } | null>();
  for (const mandi of input.mandis) {
    if (mandi.agmarknetMarketId == null) continue;
    for (const crop of input.crops) {
      try {
        const json = await fetchAgmarknetArrival(mandi.agmarknetMarketId, input.date, crop);
        arrivals.set(arrivalKey(mandi.id, crop), json === null ? null : parseAgmarknetArrivalResponse(json, crop));
      } catch (err) {
        console.warn(JSON.stringify({ code: "ARRIVALS_UNAVAILABLE", mandiId: mandi.id, crop, err: String(err) }));
        arrivals.set(arrivalKey(mandi.id, crop), null);
      }
    }
  }

  return mergePricesWithArrivals(drafts, arrivals);
}
