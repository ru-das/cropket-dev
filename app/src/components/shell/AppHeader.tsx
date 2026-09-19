// Top bar on every shell screen (SPEC.md §4.4): brand + language switch.
// On md+ the sidebar already carries the brand, so we show only a slim bar
// with the right-side controls. Sticky so it stays while the page scrolls.
// Upload status is handled by SyncBar (fixed hairline at viewport top).
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch";

export default function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-surface/90 px-4 py-2.5 backdrop-blur-xl shadow-xs md:px-6">
      {/* Brand mark — only shown on mobile; md+ sidebar carries it */}
      <span className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-ink md:hidden">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf-light via-leaf-light/80 to-terracotta-light border border-leaf/30 text-xl shadow-xs"
        >
          🌾
        </span>
        <span className="text-ink">{t("app.name")}</span>
      </span>

      {/* On md+, left side is empty — sidebar has the brand */}
      <span className="hidden md:block" />

      {/* Right cluster: language switcher */}
      <div className="flex items-center gap-2.5">
        <LanguageSwitch />
      </div>
    </header>
  );
}
