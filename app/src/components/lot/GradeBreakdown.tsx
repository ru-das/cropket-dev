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
      <span className="w-20 shrink-0 text-body text-ink">{label}</span>
      <div aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={tone === "mirchi" ? "h-full rounded-full bg-mirchi" : "h-full rounded-full bg-leaf"}
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-meta text-ink-muted">{value}</span>
    </div>
  );
}

export default function GradeBreakdown({ sizeLabel, colourPct, damagePct, confidence }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-3">
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
      <p className="text-meta text-ink-muted">
        {t("grade.confidence", { pct: Math.round(confidence) })}
      </p>
    </div>
  );
}
