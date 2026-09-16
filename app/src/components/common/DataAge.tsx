// Grey line under stale data (SPEC.md §4.22 "Old data: Prices from 2 days
// ago"). Renders nothing when the data is fresh - most screens most of the
// time, since a farmer online just synced.
import { useTranslation } from "react-i18next";
import { formatAgo, isStale } from "@/lib/dataAge";

export default function DataAge({ updatedAt }: { updatedAt: Date | string }) {
  const { t, i18n } = useTranslation();

  if (!isStale(updatedAt)) return null;

  return (
    <p className="text-meta text-ink-muted">{t("dataAge.from", { ago: formatAgo(updatedAt, i18n.language) })}</p>
  );
}
