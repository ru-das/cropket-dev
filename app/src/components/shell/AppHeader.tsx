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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b-2 border-line/80 bg-surface/90 px-4 py-2.5 backdrop-blur-xl shadow-xs">
      <span className="flex items-center gap-2 font-display text-2xl font-black tracking-tight text-ink">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-light border border-leaf/30 text-xl shadow-xs">
          🌾
        </span>
        <span>{t("app.name")}</span>
      </span>
      <div className="flex items-center gap-2.5">
        <SyncStatus pending={unresolved} total={unresolved} />
        <LanguageSwitch />
      </div>
    </header>
  );
}
