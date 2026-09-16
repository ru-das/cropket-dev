// Placeholder screen (milestone 0.2): shows the design tokens and both
// bundled fonts working together. Now also proves i18n works (0.3) via
// LanguageSwitch + t() - replaced by the real Welcome screen in 0.4
// (app shell + routes).
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./components/shell/LanguageSwitch";

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-field p-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch />
        </div>
        <p className="text-meta text-ink-muted">{t("home.todaysPrice")}</p>
        <p className="font-display text-hero text-leaf-dark">₹1,850</p>
        <p className="mt-1 text-body text-ink">{t("home.perQuintal")}</p>
        <button
          type="button"
          className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white"
        >
          {t("home.seeAdvice")}
        </button>
      </div>
    </div>
  );
}
