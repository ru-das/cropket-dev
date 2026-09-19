// Hairline upload progress bar pinned to the very top of the viewport
// (SPEC.md §4.22). Shows only when the outbox has pending items. Fixed
// position means it never affects layout on any screen size.
import { useTranslation } from "react-i18next";
import { useOutboxStatus } from "@/offline/outbox";

export default function SyncBar() {
  const { t } = useTranslation();
  const { unresolved } = useOutboxStatus();

  if (unresolved === 0) return null;

  return (
    <div
      role="status"
      aria-label={t("sync.uploading", { done: 1, total: unresolved })}
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-leaf-light"
    >
      <div className="animate-sync-shimmer h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-leaf to-transparent" />
    </div>
  );
}
