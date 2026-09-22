// Filters and sorts the listed-lots grid on BuyerHome (SPEC.md §4.10, §9.2
// Phase 3 "3.2b"). Pure logic, no Supabase, no React - the same
// `routes/onboarding/steps.ts` pattern, so it's plain to unit-test and the
// page just renders whatever this returns. All four filters (crop, grade,
// distance, quantity) run client-side over one already-fetched list, so
// ticking a checkbox re-renders instantly with no refetch.
//
// ponytail: client-side filter over a capped fetch (useListedLots() caps at
// 200 rows) - fine while the demo has a handful of lots. Swap for an
// ST_DWithin RPC + a GiST index on lots.location if listed lots ever outgrow
// one page.
import { straightLineRoute, type LatLng } from "@shared/geo.ts";
import type { Crop } from "@shared/crops.ts";
import type { Grade } from "@shared/schemas/grade.ts";

export type MarketLot = {
  id: string;
  crop: Crop;
  grade: Grade;
  quantityKg: number;
  gradeResultId: string;
  location: LatLng | null;
  createdAt: string;
};

export type MarketSort = "nearest" | "newest";

export type MarketFilters = {
  crop: Crop | null;
  /** Empty = any grade. */
  grades: Grade[];
  /** null = any distance. */
  maxKm: number | null;
  /** null = any quantity. */
  minKg: number | null;
  sort: MarketSort;
};

export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  crop: null,
  grades: [],
  maxKm: null,
  minKg: null,
  sort: "newest",
};

export type MarketLotWithDistance = MarketLot & { km: number | null };

/**
 * Applies every filter, then sorts. A lot with no GPS gets `km: null` - it's
 * kept when there's no distance filter (we just can't rank it) and dropped
 * once a `maxKm` is set (we can't prove it's near). "Nearest" sorts a null
 * km last, and falls back to newest-first entirely when the buyer has no
 * location of their own to sort from.
 */
export function filterAndSortLots(
  lots: MarketLot[],
  filters: MarketFilters,
  from: LatLng | null,
): MarketLotWithDistance[] {
  const withKm: MarketLotWithDistance[] = lots.map((lot) => ({
    ...lot,
    km: from && lot.location ? straightLineRoute(from, lot.location).km : null,
  }));

  const filtered = withKm.filter((lot) => {
    if (filters.crop && lot.crop !== filters.crop) return false;
    if (filters.grades.length > 0 && !filters.grades.includes(lot.grade)) return false;
    if (filters.minKg !== null && lot.quantityKg < filters.minKg) return false;
    if (filters.maxKm !== null && (lot.km === null || lot.km > filters.maxKm)) return false;
    return true;
  });

  const sort = filters.sort === "nearest" && from ? "nearest" : "newest";
  if (sort === "newest") {
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return filtered.sort((a, b) => {
    if (a.km === null) return b.km === null ? 0 : 1;
    if (b.km === null) return -1;
    return a.km - b.km;
  });
}
