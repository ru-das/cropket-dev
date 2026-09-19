// Top bar on every shell screen (SPEC.md §4.4): brand + sync status + language
// switch. Sticky so it stays visible while the page scrolls. Uses a subtle
// shadow instead of a plain border for a more modern floating feel.
import { useTranslation } from "react-i18next";
import { useOutboxStatus } from "@/offline/outbox";
import LanguageSwitch from "./LanguageSwitch";
import SyncStatus from "./SyncStatus";

export default function AppHeader() {
  const { t } = useTranslation();
  const { unresolved } = useOutboxStatus();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line-soft bg-surface/95 px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-lg" aria-hidden="true">🌾</span>
        <span className="text-card font-display font-semibold text-leaf-dark">
          {t("app.name")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <SyncStatus pending={unresolved} total={unresolved} />
        <LanguageSwitch />
      </div>
    </header>
  );
}
