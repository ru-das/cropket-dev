// Top bar on every shell screen (SPEC.md §4.4): brand + language switch.
// On md+ the sidebar already carries the brand, so we show only a slim bar
// with the right-side controls. Sticky so it stays while the page scrolls.
// Upload status is handled by SyncBar (fixed hairline at viewport top).
import LanguageSwitch from "./LanguageSwitch";
import AppLogo from "@/components/common/AppLogo";

export default function AppHeader() {

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line/70 bg-surface/90 px-4 py-2.5 backdrop-blur-xl shadow-xs md:px-6">
      {/* Brand mark — only shown on mobile; md+ sidebar carries it */}
      <span className="md:hidden">
        <AppLogo logoClassName="h-9 w-9" textClassName="h-7" />
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
