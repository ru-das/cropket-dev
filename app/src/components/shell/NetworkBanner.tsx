// The 🟧 offline strip every screen shows under the header (SPEC.md §4.22).
// Renders nothing while online - offline is the exception state, not the norm.
import { useTranslation } from "react-i18next";
import { useOnline } from "@/offline/network";

export default function NetworkBanner() {
  const { t } = useTranslation();
  const online = useOnline();

  if (online) return null;

  return (
    <div
      role="status"
      className="animate-fade-slide-in flex items-center gap-2 border-l-[6px] border-kesar border-b border-kesar/20 bg-kesar-light px-4 py-2.5 text-meta font-medium text-kesar-text shadow-xs"
    >
      <span aria-hidden="true">🟧</span>
      <span>{t("offline.banner")}</span>
    </div>
  );
}
