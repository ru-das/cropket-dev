// EN | हि | मरा header switch (SPEC.md §5.1, §4.2). Changes the language for
// the whole app without navigating away from the current screen.
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
      className="inline-flex items-center rounded-full border-2 border-line bg-surface-subtle p-1 shadow-xs"
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
              "h-9 min-w-9 rounded-full px-3 font-display text-sm font-bold transition-all duration-150",
              active
                ? "bg-leaf text-white shadow-xs"
                : "text-ink-muted hover:text-ink active:scale-95",
            )}
          >
            {t(`lang.short.${lang}`)}
          </button>
        );
      })}
    </div>
  );
}
