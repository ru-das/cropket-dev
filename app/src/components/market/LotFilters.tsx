// The marketplace's filter controls (SPEC.md §4.10 left panel: crop, grade,
// distance, min quantity, sort). Controlled and owns no data - BuyerHome
// holds the MarketFilters state and passes it down, same split PricesPage
// uses between its crop pills (state) and MandiList (presentational).
import { useTranslation } from "react-i18next";
import type { Crop } from "@shared/crops.ts";
import type { Grade } from "@shared/schemas/grade.ts";
import type { MarketFilters } from "@/routes/buyer/marketplace";

const CROPS: Crop[] = ["onion", "tomato", "potato"];
const GRADES: Grade[] = ["A", "B", "C"];
const DISTANCE_OPTIONS = [10, 25, 50, 100];

const CROP_EMOJI: Record<Crop, string> = { onion: "🧅", tomato: "🍅", potato: "🥔" };

export default function LotFilters({
  filters,
  onChange,
}: {
  filters: MarketFilters;
  onChange: (next: MarketFilters) => void;
}) {
  const { t } = useTranslation();

  function toggleGrade(grade: Grade) {
    const grades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    onChange({ ...filters, grades });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 font-display text-meta font-bold text-ink">{t("market.filterCrop")}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onChange({ ...filters, crop: null })}
            className={`flex h-11 shrink-0 items-center rounded-xl px-4 font-display text-sm font-bold transition-all active:scale-95 ${
              filters.crop === null
                ? "border border-leaf bg-leaf text-white shadow-premium"
                : "border border-line bg-surface text-ink shadow-xs hover:border-leaf/40"
            }`}
          >
            {t("market.anyCrop")}
          </button>
          {CROPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...filters, crop: c })}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 font-display text-sm font-bold transition-all active:scale-95 ${
                filters.crop === c
                  ? "border border-leaf bg-leaf text-white shadow-premium"
                  : "border border-line bg-surface text-ink shadow-xs hover:border-leaf/40"
              }`}
            >
              <span aria-hidden="true">{CROP_EMOJI[c]}</span>
              <span>{t(`crop.${c}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-display text-meta font-bold text-ink">{t("market.filterGrade")}</p>
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGrade(g)}
              aria-pressed={filters.grades.includes(g)}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl font-display text-sm font-bold transition-all active:scale-95 ${
                filters.grades.includes(g)
                  ? "border border-leaf bg-leaf text-white shadow-premium"
                  : "border border-line bg-surface text-ink shadow-xs hover:border-leaf/40"
              }`}
            >
              {t("grade.badge", { grade: g })}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-meta font-bold text-ink">{t("market.filterDistance")}</span>
        <select
          value={filters.maxKm ?? ""}
          onChange={(e) => onChange({ ...filters, maxKm: e.target.value === "" ? null : Number(e.target.value) })}
          className="h-12 rounded-xl border-2 border-line bg-surface px-3 font-display text-base font-bold text-ink shadow-xs outline-none focus:border-leaf"
        >
          <option value="">{t("market.anyDistance")}</option>
          {DISTANCE_OPTIONS.map((km) => (
            <option key={km} value={km}>
              {t("market.approxDistance", { km })}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-meta font-bold text-ink">{t("market.filterMinKg")}</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={filters.minKg ?? ""}
          onChange={(e) => onChange({ ...filters, minKg: e.target.value === "" ? null : Number(e.target.value) })}
          placeholder="0"
          className="h-12 rounded-xl border-2 border-line bg-surface px-3 font-display text-base font-bold tabular-nums text-ink shadow-xs outline-none focus:border-leaf"
        />
      </label>

      <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 shadow-xs">
        <input
          type="checkbox"
          checked={filters.megaLots}
          onChange={(e) => onChange({ ...filters, megaLots: e.target.checked })}
          className="h-5 w-5 shrink-0 accent-leaf"
        />
        <span className="font-display text-sm font-bold text-ink">{t("market.filterMegaLots")}</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-meta font-bold text-ink">{t("market.sortLabel")}</span>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as MarketFilters["sort"] })}
          className="h-12 rounded-xl border-2 border-line bg-surface px-3 font-display text-base font-bold text-ink shadow-xs outline-none focus:border-leaf"
        >
          <option value="newest">{t("market.sortNewest")}</option>
          <option value="nearest">{t("market.sortNearest")}</option>
        </select>
      </label>
    </div>
  );
}
