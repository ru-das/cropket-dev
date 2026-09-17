// Small sync status in the header (SPEC.md §4.22, §5.1). Props-only - the
// counts come from offline/outbox.ts via AppHeader. Renders nothing when
// total is 0 (nothing queued).
import { useTranslation } from "react-i18next";

type SyncStatusProps = {
  /** Items still waiting to upload. */
  pending: number;
  /** Items queued in total this run. 0 means "nothing to sync". */
  total: number;
};

export default function SyncStatus({ pending, total }: SyncStatusProps) {
  const { t } = useTranslation();

  if (total === 0) return null;

  const done = total - pending;
  const label = pending > 0 ? t("sync.uploading", { done, total }) : t("sync.allSaved");

  return (
    <span role="status" className="text-meta text-ink-muted">
      {pending > 0 ? (
        <span aria-hidden="true" className="motion-safe:inline-block motion-safe:animate-spin">
          ⟳
        </span>
      ) : (
        "✓"
      )}{" "}
      {label}
    </span>
  );
}
