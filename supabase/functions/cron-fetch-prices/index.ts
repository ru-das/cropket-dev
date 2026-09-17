// Daily top-up of mandi prices (SPEC.md §5.4, §9.2 Phase 2 "2.3"). Run by
// hand for the prototype (no pg_cron schedule yet - CLAUDE.md "prototype
// mode" excludes the cron wiring): fetches today's Nashik prices (real
// data.gov.in if the key is set, else a mock walk), writes `mandi_prices`,
// then recomputes `mandi_heat` for every date it just wrote. Thin by design
// (CLAUDE.md §4) - the fetch/parse logic lives in integrations/agmarknet,
// the ratio/colour math lives in _shared/domain/heat.ts.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { CROPS } from "../_shared/domain/crops.ts";
import type { Crop } from "../_shared/domain/crops.ts";
import { heatColour, heatRatio } from "../_shared/domain/heat.ts";
import { fetchPrices } from "../_shared/integrations/agmarknet/index.ts";
import type { MandiInput } from "../_shared/integrations/agmarknet/index.ts";

Deno.serve(
  handle(async (req) => {
    requireCronSecret(req);

    const { data: mandis, error: mandiError } = await db
      .from("mandis")
      .select("id, agmarknet_name, agmarknet_market_id");
    if (mandiError) throw new AppError("INTERNAL", 500, mandiError.message);

    // Latest known price/arrivals per (mandi, crop) - mock.ts walks from
    // these so demo prices move day to day instead of resetting.
    const { data: history, error: historyError } = await db
      .from("mandi_prices")
      .select("mandi_id, crop, modal_price_paise, arrivals_tonnes, date")
      .order("date", { ascending: false });
    if (historyError) throw new AppError("INTERNAL", 500, historyError.message);

    const lastByKey = new Map<string, { modalPricePaise: number; arrivalsTonnes: number | null }>();
    for (const row of history ?? []) {
      const key = `${row.mandi_id}:${row.crop}`;
      if (!lastByKey.has(key)) {
        lastByKey.set(key, { modalPricePaise: row.modal_price_paise, arrivalsTonnes: row.arrivals_tonnes });
      }
    }

    const mandiInputs: MandiInput[] = (mandis ?? []).map((m) => {
      const lastByCrop: MandiInput["lastByCrop"] = {};
      for (const crop of CROPS) {
        const last = lastByKey.get(`${m.id}:${crop}`);
        if (last) lastByCrop[crop] = last;
      }
      return { id: m.id, agmarknetName: m.agmarknet_name, agmarknetMarketId: m.agmarknet_market_id, lastByCrop };
    });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // en-CA = YYYY-MM-DD
    const rows = await fetchPrices({ date: today, crops: CROPS, mandis: mandiInputs });

    if (rows.length > 0) {
      const { error: upsertError } = await db.from("mandi_prices").upsert(
        rows.map((row) => ({
          mandi_id: row.mandiId,
          crop: row.crop,
          date: row.date,
          min_price_paise: row.minPricePaise,
          max_price_paise: row.maxPricePaise,
          modal_price_paise: row.modalPricePaise,
          arrivals_tonnes: row.arrivalsTonnes,
          source: row.source,
        })),
        { onConflict: "mandi_id,crop,date" },
      );
      if (upsertError) throw new AppError("INTERNAL", 500, upsertError.message);
    }

    // Recompute heat for every distinct date just written - usually just
    // today, but a market that only reported yesterday can add an older date.
    const dates = [...new Set(rows.map((row) => row.date))];
    let heatRowsWritten = 0;
    for (const date of dates) {
      const { data: inputs, error: inputsError } = await db.rpc("mandi_heat_inputs", { p_date: date });
      if (inputsError) throw new AppError("INTERNAL", 500, inputsError.message);

      const heatRows = (inputs ?? [])
        .map((input) => {
          const ratio = heatRatio({
            arrivalsTonnes: input.arrivals_tonnes,
            avgArrivals30dTonnes: input.avg_arrivals_30d,
            nearbyLotTonnes: input.nearby_lot_tonnes,
          });
          if (ratio === null) return null; // no 30-day average yet - show "no data" grey, never guess
          return { mandi_id: input.mandi_id, crop: input.crop as Crop, date, ratio, colour: heatColour(ratio) };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (heatRows.length > 0) {
        const { error: heatError } = await db
          .from("mandi_heat")
          .upsert(heatRows, { onConflict: "mandi_id,crop,date" });
        if (heatError) throw new AppError("INTERNAL", 500, heatError.message);
        heatRowsWritten += heatRows.length;
      }
    }

    return json({ ok: true, data: { rows: rows.length, heatRows: heatRowsWritten, source: rows[0]?.source ?? "none" } });
  }),
);
