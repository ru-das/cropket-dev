// Size/colour/damage bars + confidence line (SPEC.md §4.6). Each bar is
// decorative (aria-hidden) - the label and value text beside it already say
// everything a screen reader needs, same reasoning as SmartFrameCamera's
// brightness state text.
import { useTranslation } from "react-i18next";
import { colourLabelFor, normalizeSizeLabel, sizeFraction } from "./gradeDisplay";

type Props = {
  sizeLabel: string;
  colourPct: number;
  damagePct: number;
  confidence: number;
};

// Size and colour bars fill green because longer = better there. Damage is
// the opposite (longer = worse), so it needs its own warning colour - a
// green damage bar reads as "good" to a farmer scanning shapes, not words.
function BarRow({
  label,
  value,
  fraction,
  tone = "leaf",
}: {
  label: string;
  value: string;
  fraction: number;
  tone?: "leaf" | "mirchi";
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-22 shrink-0 font-display text-meta font-bold text-ink">{label}</span>
      <div aria-hidden="true" className="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-subtle border border-line/60 p-0.5 shadow-inner">
        <div
          className={
            tone === "mirchi"
              ? "h-full rounded-full bg-gradient-to-r from-mirchi/80 to-mirchi transition-all duration-700 ease-out"
              : "h-full rounded-full bg-gradient-to-r from-leaf to-pass transition-all duration-700 ease-out shadow-glow-leaf"
          }
          style={{ width: `${Math.max(4, Math.round(fraction * 100))}%` }}
        />
      </div>
      <span className="w-20 shrink-0 text-right font-display text-meta font-bold text-ink tabular-nums">
        {value}
      </span>
    </div>
  );
}

export default function GradeBreakdown({ sizeLabel, colourPct, damagePct, confidence }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border-2 border-line bg-surface p-6 shadow-card transition-all duration-300">
      <BarRow
        label={t("grade.size")}
        value={t(`grade.sizeLabel.${normalizeSizeLabel(sizeLabel)}`)}
        fraction={sizeFraction(sizeLabel)}
      />
      <BarRow
        label={t("grade.colour")}
        value={t(`grade.colourLabel.${colourLabelFor(colourPct)}`)}
        fraction={colourPct / 100}
      />
      <BarRow
        label={t("grade.damage")}
        value={`${Math.round(damagePct)}%`}
        fraction={damagePct / 100}
        tone="mirchi"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-line-subtle pt-4">
        <span className="font-display text-sm font-bold text-mirchi-text">{t("grade.damageHint")}</span>
        <span className="inline-flex items-center rounded-full border-2 border-line bg-surface-subtle px-3.5 py-1 font-display text-xs font-bold text-ink-muted shadow-xs">
          {t("grade.confidence", { pct: Math.round(confidence) })}
        </span>
      </div>
    </div>
  );
}
