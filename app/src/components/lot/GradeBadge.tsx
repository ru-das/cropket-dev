// Big grade badge (SPEC.md §4.6, §6.4 "min 120 px wide"). Colours per
// SPEC.md §6.2 "Grade colours: A = pass, B = haldi, C = kesar" - a light
// tint + border + text, the same treatment as shell/NetworkBanner.tsx, not a
// solid colour block. The letter and the kind word carry the meaning too
// (SPEC.md §6.1 "never colour alone").
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Grade } from "@shared/schemas/grade.ts";

type Props = {
  grade: Grade;
  kind: "indicative" | "assured";
  /** "sm" is a compact chip for a list row (LotCard) - no kind line, no min-width. Defaults to "lg". */
  size?: "lg" | "sm";
};

const TONE: Record<Grade, { box: string; glow: string; text: string; border: string }> = {
  A: {
    box: "bg-pass-light/95",
    glow: "shadow-glow-leaf",
    text: "text-pass-text",
    border: "border-pass/50",
  },
  B: {
    box: "bg-haldi-light/95",
    glow: "shadow-glow-haldi",
    text: "text-haldi-text",
    border: "border-haldi/50",
  },
  C: {
    box: "bg-kesar-light/95",
    glow: "shadow-glow-haldi",
    text: "text-kesar-text",
    border: "border-kesar/50",
  },
};

export default function GradeBadge({ grade, kind, size = "lg" }: Props) {
  const { t } = useTranslation();
  const tone = TONE[grade];

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border-2 px-3.5 py-1 font-display text-meta font-bold shadow-xs",
          tone.box,
          tone.border,
          tone.text,
        )}
      >
        {t("grade.badge", { grade })}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex min-w-[160px] flex-col items-center gap-2 rounded-3xl border-3 px-10 py-6 text-center shadow-hero transition-transform duration-300",
        tone.box,
        tone.border,
        tone.text,
        tone.glow,
      )}
    >
      <span className="font-display text-6xl font-black leading-none tracking-tight">
        {t("grade.badge", { grade })}
      </span>
      <div className="flex items-center gap-1.5 rounded-full bg-surface/70 px-3.5 py-0.5 shadow-xs backdrop-blur-sm">
        <span className="font-display text-sm font-bold tracking-wide">
          {t(`grade.kind.${kind}`)}
        </span>
      </div>
    </div>
  );
}
