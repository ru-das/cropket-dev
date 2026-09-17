// The strip every screen shows when the outbox needs attention (SPEC.md
// §5.8 rule 4, CLAUDE.md §5, milestone 1.7). Sits under NetworkBanner in
// AppShell, same "renders nothing in the normal case" pattern. Two states:
// a failed item (needs a tap) or a pending item waiting over 24 h (just a
// warning - it is still retrying on its own).
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

  if (view.kind === "none") return null;

  if (view.kind === "failed") {
    return (
      <div
        role="status"
        className="animate-fade-slide-in flex items-center justify-between gap-2 border-l-[6px] border-mirchi bg-mirchi/10 px-4 py-2 text-meta text-mirchi-text"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true">🔴</span>
          <span>{t("sync.notSaved")}</span>
        </span>
        <button
          type="button"
          onClick={() => void retryFailed()}
          className="flex h-12 items-center rounded-button border border-mirchi-text px-4 text-meta font-semibold text-mirchi-text"
        >
          {t("sync.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="animate-fade-slide-in flex items-center gap-2 border-l-[6px] border-kesar bg-kesar/10 px-4 py-2 text-meta text-kesar-text"
    >
      <span aria-hidden="true">🟧</span>
      <span>{t("sync.waitingLong")}</span>
    </div>
  );
}
