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
      <span className="w-20 shrink-0 text-body text-ink">{label}</span>
      <div aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-line-soft">
        <div
          className={
            tone === "mirchi"
              ? "h-full rounded-full bg-mirchi transition-all duration-500 ease-out"
              : "h-full rounded-full bg-leaf transition-all duration-500 ease-out"
          }
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-meta font-medium text-ink-muted">{value}</span>
    </div>
  );
}

export default function GradeBreakdown({ sizeLabel, colourPct, damagePct, confidence }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-3.5 rounded-card border border-line-soft bg-surface p-4 shadow-[var(--shadow-soft)]">
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
      <p className="text-meta text-mirchi-text">{t("grade.damageHint")}</p>
      <div className="border-t border-line-soft pt-2">
        <p className="text-meta font-medium text-ink-muted">
          {t("grade.confidence", { pct: Math.round(confidence) })}
        </p>
      </div>
    </div>
  );
}
