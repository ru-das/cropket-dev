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
    <div role="group" aria-label={t("lang.switchLabel")} className="flex gap-1">
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
              "h-12 min-w-12 rounded-button border px-2 text-meta font-semibold",
              active ? "border-leaf bg-leaf text-white" : "border-line bg-surface text-ink",
            )}
          >
            {t(`lang.short.${lang}`)}
          </button>
        );
      })}
    </div>
  );
}
