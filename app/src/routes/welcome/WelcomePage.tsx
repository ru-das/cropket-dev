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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-field p-4">
      {/* Soft decorative gradient backdrop - evokes a farm field horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(31,107,58,0.06), transparent), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(224,123,31,0.04), transparent)",
        }}
      />

      <div className="relative w-full max-w-sm text-center">
        {/* Brand mark with subtle entrance */}
        <div className="animate-fade-slide-in flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-card bg-leaf shadow-[var(--shadow-soft)]">
            <span className="text-4xl">🌾</span>
          </div>
          <p className="text-hero font-display text-leaf-dark">{t("app.name")}</p>
          <p className="text-body text-ink-muted">{t("app.tagline")}</p>
        </div>

        <div
          role="group"
          aria-label={t("welcome.choose")}
          className="mt-10 flex flex-col gap-3"
        >
          {LANGS.map((lang, i) => (
            <button
              key={lang}
              type="button"
              onClick={() => choose(lang)}
              className="animate-fade-slide-in h-14 w-full rounded-button border border-line bg-surface text-body font-semibold text-leaf-dark shadow-[var(--shadow-soft)] hover:border-leaf hover:bg-leaf/5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {t(`lang.${lang}`)}
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
