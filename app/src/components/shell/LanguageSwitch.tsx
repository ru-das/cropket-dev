// EN | हि | मरा header switch (SPEC.md §5.1, §4.2). Changes the language for
// the whole app without navigating away from the current screen. Compact
// pill-style toggle group for a modern look.
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { setLang, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["en", "hi", "mr"];

export default function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div
      role="group"
      aria-label={t("lang.switchLabel")}
      className="flex gap-0.5 rounded-button bg-field p-0.5"
    >
      {LANGS.map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            aria-current={active || undefined}
            aria-label={t(`lang.${lang}`)}
            onClick={() => setLang(lang)}
            className={cn(
              "h-9 min-w-10 rounded-button px-2 text-meta font-semibold transition-all duration-200",
              active
                ? "bg-leaf text-white shadow-[var(--shadow-soft)]"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {t(`lang.short.${lang}`)}
          </button>
        );
      })}
    </div>
  );
}
