// Speaker button used across the app (SPEC.md §5.1, §6.1 "icon + word + 🔊
// together"). Reads a translated string aloud via lib/voice/speak.ts. Only
// browser voice in the prototype (SPEC.md §5.9 layer 3) - bundled clips and
// the `tts` function are out of prototype scope (CLAUDE.md §9.5).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { Volume2, VolumeX } from "lucide-react";
import { speak } from "@/lib/voice/speak";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  textKey: ParseKeys;
  values?: Record<string, string | number>;
  className?: string;
  /** When set, renders as the full-width "🔊 <label>" bar from SPEC.md §4.6
   *  instead of the round icon-only button used everywhere else. */
  label?: string;
};

export default function VoiceButton({ textKey, values, className, label }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<"idle" | "speaking" | "unavailable">("idle");

  async function handleClick() {
    setState("speaking");
    const spoke = await speak({ text: t(textKey, values), lang: i18n.language as Lang });
    setState(spoke ? "idle" : "unavailable");
  }

  const unavailableLabel = t("voice.unavailable");
  const icon =
    state === "unavailable" ? (
      <VolumeX aria-hidden="true" size={22} />
    ) : (
      <Volume2
        aria-hidden="true"
        size={22}
        className={cn(
          "transition-transform duration-200",
          state === "speaking" && "scale-110 text-leaf stroke-[2.5]",
        )}
      />
    );

  if (label) {
    const barLabel = state === "unavailable" ? unavailableLabel : label;
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "unavailable"}
        aria-label={barLabel}
        className={cn(
          "relative overflow-hidden flex h-15 w-full items-center justify-center gap-3 rounded-2xl border-2 border-line bg-surface shadow-card font-display text-base font-bold text-ink hover:border-leaf hover:bg-surface-subtle disabled:text-ink-muted transition-all duration-200 active:scale-[0.98]",
          state === "speaking" && "border-leaf bg-leaf-light text-leaf-dark shadow-glow-leaf",
          className,
        )}
      >
        {state === "speaking" && (
          <div aria-hidden="true" className="flex items-center gap-1">
            <span className="h-4 w-1 animate-pulse rounded-full bg-leaf" />
            <span className="h-6 w-1 animate-pulse rounded-full bg-leaf [animation-delay:150ms]" />
            <span className="h-3 w-1 animate-pulse rounded-full bg-leaf [animation-delay:300ms]" />
          </div>
        )}
        {icon}
        <span>{barLabel}</span>
      </button>
    );
  }

  const iconLabel = state === "unavailable" ? unavailableLabel : t("voice.listen");
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      {/* Concentric organic ripple wave rings radiating outward while speaking */}
      {state === "speaking" && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl border border-leaf/40 bg-leaf-light/30 animate-organic-ripple-1"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl border border-leaf/30 bg-leaf-light/20 animate-organic-ripple-2"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl border border-leaf/20 bg-leaf-light/10 animate-organic-ripple-3"
          />
        </>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "unavailable"}
        aria-label={iconLabel}
        title={iconLabel}
        className={cn(
          "relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-line bg-surface shadow-xs text-leaf-dark hover:border-leaf hover:bg-leaf-light/50 active:scale-90 transition-all duration-200 disabled:text-ink-muted disabled:border-line disabled:bg-surface",
          state === "speaking" && "border-leaf bg-leaf-light text-leaf-dark ring-4 ring-leaf/20 shadow-glow-leaf scale-105",
          className,
        )}
      >
        {icon}
      </button>
    </div>
  );
}
