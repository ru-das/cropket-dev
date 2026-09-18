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
      <span className="w-20 shrink-0 text-meta font-medium text-ink">{label}</span>
      <div aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-line/80">
        <div
          className={
            tone === "mirchi"
              ? "h-full rounded-full bg-mirchi transition-all duration-300"
              : "h-full rounded-full bg-pass transition-all duration-300"
          }
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-meta font-semibold text-ink">{value}</span>
    </div>
  );
}

export default function GradeBreakdown({ sizeLabel, colourPct, damagePct, confidence }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-line/80 bg-surface-subtle p-3.5 shadow-xs">
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
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2">
        <span className="text-meta font-medium text-mirchi-text">{t("grade.damageHint")}</span>
        <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-meta font-medium text-ink-muted shadow-xs">
          {t("grade.confidence", { pct: Math.round(confidence) })}
        </span>
      </div>
    </div>
  );
}
