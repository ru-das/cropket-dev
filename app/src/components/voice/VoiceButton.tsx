// Speaker button used across the app (SPEC.md §5.1, §6.1 "icon + word + 🔊
// together"). Reads a translated string aloud via lib/voice/speak.ts. Only
// browser voice for now - bundled clips (SPEC.md §5.9 layer 1) land in 1.5.
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
};

export default function VoiceButton({ textKey, values, className }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<"idle" | "speaking" | "unavailable">("idle");

  async function handleClick() {
    setState("speaking");
    const spoke = await speak({ text: t(textKey, values), lang: i18n.language as Lang });
    setState(spoke ? "idle" : "unavailable");
  }

  const label = state === "unavailable" ? t("voice.unavailable") : t("voice.listen");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "unavailable"}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-leaf-dark disabled:text-ink-muted",
        className,
      )}
    >
      {state === "unavailable" ? (
        <VolumeX aria-hidden="true" size={22} />
      ) : (
        <Volume2
          aria-hidden="true"
          size={22}
          className={cn(state === "speaking" && "motion-safe:animate-pulse")}
        />
      )}
    </button>
  );
}
