// The strip every screen shows when the outbox needs attention (SPEC.md
// §5.8 rule 4, CLAUDE.md §5, milestone 1.7). Sits under NetworkBanner in
// AppShell, same "renders nothing in the normal case" pattern. Two states:
// a failed item (needs a tap) or a pending item waiting over 24 h (just a
// warning - it is still retrying on its own).
import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { retryFailed, useOutboxStatus } from "@/offline/outbox";
import { syncTroubleView } from "./syncTrouble";

export default function SyncTrouble() {
  const { t } = useTranslation();
  const snapshot = useOutboxStatus();
  // ponytail: `now` is read once per render, not on a ticking timer - the
  // 24 h strip can show up to a poll-interval late. Add a timer only if a
  // demo actually needs the warning to appear the instant it crosses 24 h.
  const view = syncTroubleView(snapshot);

  // Dismissing hides the strip, but a new failure (or the wait crossing
  // 24 h again after a retry) must bring it back - so the dismissal is
  // keyed to what's actually wrong, not just "hidden forever". This is
  // React's "adjust state while rendering" pattern, not an effect, so
  // there's no flash of the old strip first.
  const signal = `${view.kind}:${snapshot.failed}`;
  const [dismissed, setDismissed] = useState({ signal, hidden: false });
  if (dismissed.signal !== signal) {
    setDismissed({ signal, hidden: false });
  }

  if (view.kind === "none" || dismissed.hidden) return null;

  const dismissButton = (
    <button
      type="button"
      onClick={() => setDismissed({ signal, hidden: true })}
      aria-label={t("common.dismiss")}
      className="flex h-12 w-12 shrink-0 items-center justify-center"
    >
      <X aria-hidden="true" size={20} />
    </button>
  );

  if (view.kind === "failed") {
    return (
      <div
        role="status"
        className="animate-fade-slide-in mx-4 my-2.5 flex items-center justify-between gap-2.5 rounded-2xl border-2 border-mirchi/35 bg-gradient-to-r from-mirchi-light via-mirchi-light/90 to-surface pl-4 pr-1.5 py-2 text-meta text-mirchi-text shadow-xs"
      >
        <span className="flex items-center gap-2.5 font-display font-bold">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-mirchi animate-pulse shrink-0" />
          <span>{t("sync.notSaved")}</span>
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void retryFailed()}
            className="flex h-10 items-center rounded-xl border border-mirchi-text/40 bg-surface px-3.5 font-display text-meta font-bold text-mirchi-text shadow-xs active:scale-95 transition-all"
          >
            {t("sync.tryAgain")}
          </button>
          {dismissButton}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="animate-fade-slide-in mx-4 my-2.5 flex items-center justify-between gap-2.5 rounded-2xl border-2 border-kesar/35 bg-gradient-to-r from-kesar-light via-kesar-light/90 to-surface pl-4 pr-1.5 py-2 text-meta text-kesar-text shadow-xs"
    >
      <span className="flex items-center gap-2.5 font-display font-bold">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-kesar animate-pulse shrink-0" />
        <span>{t("sync.waitingLong")}</span>
      </span>
      {dismissButton}
    </div>
  );
}
