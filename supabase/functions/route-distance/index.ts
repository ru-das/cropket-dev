// Real road distance/time to a list of mandis (SPEC.md §5.4, §9.2 Phase 2
// "2.5"). Called by the Net-₹ comparator screen. Thin by design (CLAUDE.md
// §4) - the OpenRouteService call lives in integrations/ors, this file only
// adds the 24 h cache (route_cache, SPEC.md §5.6) around it.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { RouteRequest, RouteLeg } from "../_shared/domain/schemas/route.ts";
import type { LatLng } from "../_shared/domain/geo.ts";
import { routeDistance } from "../_shared/integrations/ors/index.ts";
import { isMock } from "../_shared/integrations/mode.ts";

const CACHE_HOURS = 24;

// route_cache's coordinate columns are numeric(8,3) (~110 m buckets) - this
// is the only place that rounds to match, so a repeat lookup for the same
// farm/mandi pair always lands on the same row.
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function cacheKey(p: LatLng): string {
  return `${round3(p.lat)}:${round3(p.lng)}`;
}

Deno.serve(
  handle(async (req) => {
    await requireRole(req, ["farmer"]);
    const input = RouteRequest.parse(await req.json());

    // route_cache only ever holds real ORS results (see its migration) - a
    // mock result is free to recompute, so skip the DB round trip entirely
    // when ORS_API_KEY is missing.
    if (isMock("ors", ["ORS_API_KEY"])) {
      const legs = await routeDistance({ from: input.from, to: input.to });
      return json({ ok: true, data: { legs } });
    }

    const fromLat = round3(input.from.lat);
    const fromLng = round3(input.from.lng);
    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();

    const { data: cached, error: cacheError } = await db
      .from("route_cache")
      .select("to_lat, to_lng, km, minutes")
      .eq("from_lat", fromLat)
      .eq("from_lng", fromLng)
      .gt("fetched_at", cutoff);
    if (cacheError) throw new AppError("INTERNAL", 500, cacheError.message);

    const byKey = new Map<string, RouteLeg>(
      (cached ?? []).map((row) => [
        `${row.to_lat}:${row.to_lng}`,
        { km: row.km, minutes: row.minutes, source: "ors" },
      ]),
    );

    const missing = input.to.filter((dest) => !byKey.has(cacheKey(dest)));
    const fetched = missing.length > 0 ? await routeDistance({ from: input.from, to: missing }) : [];

    if (fetched.length > 0) {
      const { error: upsertError } = await db.from("route_cache").upsert(
        missing.map((dest, i) => ({
          from_lat: fromLat,
          from_lng: fromLng,
          to_lat: round3(dest.lat),
          to_lng: round3(dest.lng),
          km: fetched[i].km,
          minutes: fetched[i].minutes,
        })),
      );
      if (upsertError) throw new AppError("INTERNAL", 500, upsertError.message);
      missing.forEach((dest, i) => byKey.set(cacheKey(dest), fetched[i]));
    }

    const legs = input.to.map((dest) => byKey.get(cacheKey(dest))!);
    return json({ ok: true, data: { legs } });
  }),
);
