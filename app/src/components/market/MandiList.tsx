// Coloured list of mandis (SPEC.md §4.8 MandiList) - the offline / no-
// MapTiler-key view, and where the heat-colour legend lives either way.
// An emoji dot carries the colour (SPEC.md §6.1 "never colour alone" -
// shape + colour together, same trick ScanResultPage's "✅" already uses),
// so no bg-* class or extra aria-label is needed per row.
import { useTranslation } from "react-i18next";
import { formatRupees } from "@shared/money.ts";
import type { MandiPrice } from "@/services/prices";
import type { HeatColour } from "@shared/heat.ts";

const HEAT_EMOJI: Record<HeatColour, string> = { red: "🔴", yellow: "🟡", green: "🟢" };
const NO_DATA_EMOJI = "⚪";

export default function MandiList({ mandiPrices }: { mandiPrices: MandiPrice[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {mandiPrices.map((m) => (
          <li
            key={m.mandi.id}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition-all"
          >
            <span aria-hidden="true" className="shrink-0 text-base">
              {m.heat ? HEAT_EMOJI[m.heat.colour] : NO_DATA_EMOJI}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-ink">{m.mandi.name}</span>
              {m.heat && (
                <span className="text-xs font-medium text-ink-muted">
                  {t(`heat.${m.heat.colour}`)}
                </span>
              )}
            </div>
            <span className="font-display text-lg font-bold tabular-nums text-ink">
              {formatRupees(m.todayModalPricePaise)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-subtle p-3 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span aria-hidden="true">🔴</span> {t("heat.red")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span aria-hidden="true">🟡</span> {t("heat.yellow")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span aria-hidden="true">🟢</span> {t("heat.green")}
        </span>
      </div>
    </div>
  );
}
