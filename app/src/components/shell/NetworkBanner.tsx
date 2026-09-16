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
      className="flex items-center gap-2 border-l-[6px] border-kesar bg-kesar/10 px-4 py-2 text-meta text-kesar-text"
    >
      <span aria-hidden="true">🟧</span>
      <span>{t("offline.banner")}</span>
    </div>
  );
}
