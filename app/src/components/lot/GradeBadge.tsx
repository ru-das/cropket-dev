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

const TONE: Record<Grade, { box: string; glow: string; text: string; border: string; ambient: string }> = {
  A: {
    box: "bg-gradient-to-b from-pass-light via-pass-light/90 to-surface",
    glow: "shadow-hero",
    text: "text-pass-text",
    border: "border-pass/50",
    ambient: "bg-pass-light/60",
  },
  B: {
    box: "bg-gradient-to-b from-haldi-light via-haldi-light/90 to-surface",
    glow: "shadow-hero",
    text: "text-haldi-text",
    border: "border-haldi/50",
    ambient: "bg-haldi-light/60",
  },
  C: {
    box: "bg-gradient-to-b from-kesar-light via-kesar-light/90 to-surface",
    glow: "shadow-hero",
    text: "text-kesar-text",
    border: "border-kesar/50",
    ambient: "bg-kesar-light/60",
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
        "relative mx-auto flex min-w-[170px] flex-col items-center gap-2 overflow-hidden rounded-3xl border-3 px-10 py-7 text-center transition-all duration-300 animate-float-gentle",
        tone.box,
        tone.border,
        tone.text,
        tone.glow,
      )}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl blur-xl opacity-70",
          tone.ambient,
        )}
      />

      <span className="relative z-10 font-display text-7xl font-black leading-none tracking-tight">
        {t("grade.badge", { grade })}
      </span>
      <div className="relative z-10 flex items-center gap-1.5 rounded-full border border-line/60 bg-surface/80 px-4 py-1 shadow-xs backdrop-blur-md">
        <span className="font-display text-sm font-bold tracking-wide text-ink">
          {t(`grade.kind.${kind}`)}
        </span>
      </div>
    </div>
  );
}
