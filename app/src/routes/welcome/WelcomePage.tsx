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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-field px-5 py-8">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-leaf-light/60 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Brand emblem */}
        <div className="relative mx-auto mb-5 flex h-22 w-22 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-leaf-light/80 shadow-glow-leaf transition-transform duration-300"
          />
          <div
            aria-hidden="true"
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-leaf/25 bg-surface text-4xl shadow-premium"
          >
            🌾
          </div>
        </div>

        <h1 className="font-display text-5xl font-black tracking-tight text-ink">
          {t("app.name")}
        </h1>
        <p className="mt-2 text-body font-semibold text-ink-muted">{t("app.tagline")}</p>

        {/* Language selector cards */}
        <div role="group" aria-label={t("welcome.choose")} className="mt-10 flex flex-col gap-3.5">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => choose(lang)}
              className="group flex h-18 w-full items-center justify-between rounded-2xl border-2 border-line bg-surface px-6 text-card font-bold text-ink shadow-card transition-all duration-150 ease-out hover:border-leaf hover:bg-leaf-light/30 hover:shadow-premium active:scale-[0.98]"
            >
              <span className="font-display text-xl group-hover:text-leaf-dark">
                {t(`lang.${lang}`)}
              </span>
              <div
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle text-ink-muted transition-all duration-150 group-hover:bg-leaf group-hover:text-surface group-hover:translate-x-0.5"
              >
                <span className="text-base font-black">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <VoiceButton textKey="welcome.choose" className="h-11 w-11 shadow-premium" />
        </div>
      </div>
    </div>
  );
}
