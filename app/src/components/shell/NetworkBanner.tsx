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
      className="animate-fade-slide-in mx-4 my-2.5 flex items-center gap-2.5 rounded-2xl border-2 border-kesar/35 bg-gradient-to-r from-kesar-light via-kesar-light/90 to-surface px-4 py-2 text-meta font-bold text-kesar-text shadow-xs"
    >
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-kesar animate-pulse shadow-glow-haldi shrink-0" />
      <span className="font-display">{t("offline.banner")}</span>
    </div>
  );
}
