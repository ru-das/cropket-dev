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
            className="flex min-h-14 items-center gap-3 rounded-card border border-line-soft bg-surface p-3 shadow-[var(--shadow-soft)]"
          >
            <span aria-hidden="true" className="text-body">
              {m.heat ? HEAT_EMOJI[m.heat.colour] : NO_DATA_EMOJI}
            </span>
            <span className="flex-1 text-body text-ink">{m.mandi.name}</span>
            <span className="text-body font-semibold text-ink">
              {formatRupees(m.todayModalPricePaise)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-muted">
        <span>🔴 {t("heat.red")}</span>
        <span>🟡 {t("heat.yellow")}</span>
        <span>🟢 {t("heat.green")}</span>
      </div>
    </div>
  );
}
