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

const TONE: Record<Grade, string> = {
  A: "border-pass/40 bg-pass-light text-pass-text",
  B: "border-haldi/40 bg-haldi-light text-haldi-text",
  C: "border-kesar/40 bg-kesar-light text-kesar-text",
};

export default function GradeBadge({ grade, kind, size = "lg" }: Props) {
  const { t } = useTranslation();

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-meta font-semibold shadow-xs",
          TONE[grade],
        )}
      >
        {t("grade.badge", { grade })}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex min-w-[130px] flex-col items-center gap-1.5 rounded-2xl border-2 px-8 py-5 shadow-card",
        TONE[grade],
      )}
    >
      <span className="text-hero font-display font-bold leading-none">{t("grade.badge", { grade })}</span>
      <span className="text-meta font-medium tracking-wide uppercase opacity-90">{t(`grade.kind.${kind}`)}</span>
    </div>
  );
}
