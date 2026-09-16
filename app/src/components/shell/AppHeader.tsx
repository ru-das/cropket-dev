// Top bar on every shell screen (SPEC.md §4.4): brand + sync status + language
// switch. Sticky so it stays visible while the page scrolls. No shadow, a
// 1 px border like the rest of the design system (SPEC.md §6.4).
import { useTranslation } from "react-i18next";
import { useOutboxStatus } from "@/offline/outbox";
import LanguageSwitch from "./LanguageSwitch";
import SyncStatus from "./SyncStatus";

export default function AppHeader() {
  const { t } = useTranslation();
  const pending = useOutboxStatus();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2">
      <span className="text-card font-display font-semibold text-leaf-dark">
        🌾 {t("app.name")}
      </span>
      <div className="flex items-center gap-3">
        {/* pending===total: nothing tracks a per-batch "done" count yet -
            see the ponytail note on outbox.ts's unresolvedCount. */}
        <SyncStatus pending={pending} total={pending} />
        <LanguageSwitch />
      </div>
    </header>
  );
}
