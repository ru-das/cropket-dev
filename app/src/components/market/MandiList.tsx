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
    <div className="flex flex-col gap-3.5">
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card divide-y divide-line/60">
        {mandiPrices.map((m) => (
          <li
            key={m.mandi.id}
            className="flex items-center gap-3.5 p-4 transition-colors hover:bg-surface-subtle/50 active:bg-surface-subtle"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-line text-lg"
            >
              {m.heat ? HEAT_EMOJI[m.heat.colour] : NO_DATA_EMOJI}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-display text-base font-bold text-ink leading-snug">
                {m.mandi.name}
              </span>
              {m.heat && (
                <span className="font-display text-xs font-semibold text-ink-muted">
                  {t(`heat.${m.heat.colour}`)}
                </span>
              )}
              {m.isStale && (
                <span className="block font-display text-xs text-amber-600">
                  {t("prices.staleDate", {
                    date: new Date(m.priceDate + "T00:00:00").toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    }),
                  })}
                </span>
              )}
            </div>
            <span className="rounded-xl bg-surface-subtle px-3 py-1 font-display text-xl font-black tabular-nums text-ink border border-line">
              {formatRupees(m.todayModalPricePaise)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-3 text-xs text-ink-muted shadow-card">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-2.5 py-1 font-display font-bold">
          <span aria-hidden="true">🔴</span> {t("heat.red")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-2.5 py-1 font-display font-bold">
          <span aria-hidden="true">🟡</span> {t("heat.yellow")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-2.5 py-1 font-display font-bold">
          <span aria-hidden="true">🟢</span> {t("heat.green")}
        </span>
      </div>
    </div>
  );
}
