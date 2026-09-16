// First screen anyone sees (SPEC.md §4.1). No header/bottom nav here - the
// shell only wraps logged-in screens. Picking a language also moves on, since
// there is nothing else to do on this screen.
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { setLang, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["en", "hi", "mr"];

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function choose(lang: Lang) {
    setLang(lang);
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-field p-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-hero font-display text-leaf-dark">🌾 {t("app.name")}</p>
        <p className="mt-2 text-body text-ink-muted">{t("app.tagline")}</p>

        <div role="group" aria-label={t("welcome.choose")} className="mt-8 flex flex-col gap-3">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => choose(lang)}
              className="h-14 w-full rounded-button border border-leaf bg-surface text-body font-semibold text-leaf-dark"
            >
              {t(`lang.${lang}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
