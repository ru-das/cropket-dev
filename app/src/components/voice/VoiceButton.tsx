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
        className={cn(state === "speaking" && "motion-safe:animate-pulse")}
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
          "flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface shadow-card text-body font-semibold text-ink hover:bg-surface-subtle disabled:text-ink-muted",
          state === "speaking" && "border-leaf bg-leaf-light text-leaf-dark",
          className,
        )}
      >
        {icon}
        <span>{barLabel}</span>
      </button>
    );
  }

  const iconLabel = state === "unavailable" ? unavailableLabel : t("voice.listen");
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "unavailable"}
      aria-label={iconLabel}
      title={iconLabel}
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-leaf-dark hover:border-leaf/60 hover:bg-leaf-light/40 active:scale-90 transition-all disabled:text-ink-muted disabled:border-line disabled:bg-surface",
        state === "speaking" && "border-leaf bg-leaf-light text-leaf-dark ring-3 ring-leaf/20",
        className,
      )}
    >
      {icon}
    </button>
  );
}
