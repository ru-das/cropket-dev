// First screen anyone sees (SPEC.md §4.1). No header/bottom nav here - the
// shell only wraps logged-in screens. Picking a language also moves on, since
// there is nothing else to do on this screen.
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { setLang, type Lang } from "@/lib/i18n";
import VoiceButton from "@/components/voice/VoiceButton";
import logoSrc from "@/assets/cropket-logo.png";
import textSrc from "@/assets/cropket-text.png";

const LANGS: Lang[] = ["en", "hi", "mr"];

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function choose(lang: Lang) {
    setLang(lang);
    navigate("/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-field px-5 py-8">
      {/* Warm dual-tone ambient background glows — scale up on wider screens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-leaf-light/70 blur-3xl md:h-[600px] md:w-[600px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-terracotta-light/60 blur-3xl md:h-[500px] md:w-[500px]"
      />

      {/* Card: narrower on mobile, generous on md+ */}
      <div className="relative z-10 w-full max-w-sm text-center md:max-w-md lg:max-w-lg">
        {/* Brand emblem with gentle breathing float */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center animate-float-gentle md:h-32 md:w-32">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-leaf-light to-terracotta-light shadow-glow-leaf"
          />
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            className="relative h-20 w-20 object-contain md:h-28 md:w-28"
          />
        </div>

        {/* Wordmark — visually replaces the h1 text; screen readers still get t("app.name") as page title */}
        <h1 className="sr-only">{t("app.name")}</h1>
        <img
          src={textSrc}
          alt={t("app.name")}
          className="mx-auto h-12 w-auto object-contain md:h-16"
        />
        <p className="mt-2.5 text-body font-semibold text-ink-muted">{t("app.tagline")}</p>

        {/* Language selector cards */}
        <div role="group" aria-label={t("welcome.choose")} className="mt-10 flex flex-col gap-3.5">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => choose(lang)}
              className="group flex h-18 w-full items-center justify-between rounded-2xl border-2 border-line bg-gradient-to-r from-surface to-surface-subtle/50 px-6 text-card font-bold text-ink shadow-card transition-all duration-200 ease-out hover:border-leaf/60 hover:shadow-premium hover:-translate-y-0.5 active:scale-[0.98] md:h-20"
            >
              <span className="font-display text-xl group-hover:text-leaf-dark md:text-2xl">
                {t(`lang.${lang}`)}
              </span>
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line text-ink-muted transition-all duration-200 group-hover:border-leaf group-hover:bg-leaf group-hover:text-surface group-hover:translate-x-1 shadow-xs"
              >
                <span className="text-lg font-black">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <VoiceButton textKey="welcome.choose" className="h-12 w-12 shadow-premium" />
        </div>
      </div>
    </div>
  );
}

