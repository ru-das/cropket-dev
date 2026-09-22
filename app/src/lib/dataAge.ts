// Pure "how old is this data" helpers (SPEC.md §4.22 "Old data", §5.8 "every
// farmer-facing query stores updatedAt; DataAge shows it when older than 6
// hours"). No React here so this is unit-testable on its own; the component
// is components/common/DataAge.tsx.
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/** True once `updatedAt` is more than 6 hours before `now`. */
export function isStale(updatedAt: Date | string, now: Date = new Date()): boolean {
  const then = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  return now.getTime() - then.getTime() > STALE_AFTER_MS;
}

/**
 * "2 minutes ago" / "7 hours ago" / "2 days ago", in the given language.
 * Intl does the translation. Minute granularity only matters to callers
 * showing something that changes within the hour (LiveBidBox's recent-bids
 * list, SPEC.md §4.11 "2 min ago") - DataAge never calls this under 6 hours
 * (isStale()'s own threshold), so that caller's copy is unaffected.
 */
export function formatAgo(updatedAt: Date | string, lang: string, now: Date = new Date()): string {
  const then = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  const diffMs = then.getTime() - now.getTime(); // negative = in the past
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

  const minutes = Math.round(diffMs / (60 * 1000));
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");

  const hours = Math.round(diffMs / (60 * 60 * 1000));
  if (Math.abs(hours) < 48) return rtf.format(hours, "hour");

  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return rtf.format(days, "day");
}
