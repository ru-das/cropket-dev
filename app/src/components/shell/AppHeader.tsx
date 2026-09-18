// Top bar on every shell screen (SPEC.md §4.4): brand + sync status + language
// switch. Sticky so it stays visible while the page scrolls. No shadow, a
// 1 px border like the rest of the design system (SPEC.md §6.4).
import { useTranslation } from "react-i18next";
import { useOutboxStatus } from "@/offline/outbox";
import LanguageSwitch from "./LanguageSwitch";
import SyncStatus from "./SyncStatus";

export default function AppHeader() {
  const { t } = useTranslation();
  const { unresolved } = useOutboxStatus();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur-md">
      <span className="flex items-center gap-1.5 text-card font-display font-bold tracking-tight text-leaf-dark">
        <span aria-hidden="true" className="text-xl">🌾</span>
        <span>{t("app.name")}</span>
      </span>
      <div className="flex items-center gap-2">
        {/* pending===total: nothing tracks a per-batch "done" count yet -
            see the ponytail note on outbox.ts's snapshot. */}
        <SyncStatus pending={unresolved} total={unresolved} />
        <LanguageSwitch />
      </div>
    </header>
  );
}
