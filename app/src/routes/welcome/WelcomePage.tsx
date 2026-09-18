// First screen anyone sees (SPEC.md §4.1). No header/bottom nav here - the
// shell only wraps logged-in screens. Picking a language also moves on, since
// there is nothing else to do on this screen.
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { setLang, type Lang } from "@/lib/i18n";
import VoiceButton from "@/components/voice/VoiceButton";

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
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-leaf/20 bg-leaf-light text-4xl shadow-card"
        >
          🌾
        </div>
        <h1 className="text-hero font-display font-bold tracking-tight text-leaf-dark">
          {t("app.name")}
        </h1>
        <p className="mt-2 text-body font-medium text-ink-muted">{t("app.tagline")}</p>

        <div role="group" aria-label={t("welcome.choose")} className="mt-8 flex flex-col gap-3">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => choose(lang)}
              className="flex h-16 w-full items-center justify-between rounded-2xl border border-line bg-surface px-6 text-card font-semibold text-ink shadow-card transition-all duration-150 hover:border-leaf hover:bg-surface-subtle active:scale-[0.98]"
            >
              <span>{t(`lang.${lang}`)}</span>
              <span aria-hidden="true" className="text-xl text-leaf-dark">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <VoiceButton textKey="welcome.choose" />
        </div>
      </div>
    </div>
  );
}
