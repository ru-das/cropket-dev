// Digital Khata (SPEC.md §4.15, §9.2 Phase 4 "4.4 Khata screen"). Reads the
// khata_entries rows fund_escrow() (4.3) already writes at FUNDED - 4.6/4.8
// will add 🔵/🟢 rows for the same deals, which is why the summary/list
// come from summariseKhata() rather than the raw query result.
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import VoiceButton from "@/components/voice/VoiceButton";
import DataAge from "@/components/common/DataAge";
import KhataSummary from "@/components/money/KhataSummary";
import KhataRow from "@/components/money/KhataRow";
import { summariseKhata, useMyKhata } from "@/services/khata";

export default function KhataPage() {
  const { t } = useTranslation();
  const { data, dataUpdatedAt, isError, refetch } = useMyKhata();

  // isError with no cached data means the fetch failed and there is nothing
  // saved to fall back to (SPEC.md §5.8 still shows the saved copy when
  // there is one) - same pattern PricesPage uses.
  if (isError && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-mirchi/40 bg-mirchi-light p-6 text-center shadow-card">
        <p className="text-body font-semibold text-mirchi-text">{t("common.loadFailed")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="h-12 rounded-xl border border-mirchi-text px-5 text-body font-bold text-mirchi-text transition-transform active:scale-97"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }
  if (!data) return <p className="text-body text-ink-muted">{t("common.loading")}</p>;

  const summary = summariseKhata(data);
  const isEmpty = summary.rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">{t("nav.khata")}</h1>
        <VoiceButton textKey="nav.khata" className="h-11 w-11 shadow-xs" />
      </div>

      <DataAge updatedAt={new Date(dataUpdatedAt)} />

      {isEmpty ? (
        <div className="relative overflow-hidden mt-6 flex flex-col items-center gap-5 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-haldi/30 bg-haldi-light text-4xl shadow-xs"
          >
            📒
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink">{t("khata.empty")}</p>
          </div>
          <Link
            to="/farmer/lots"
            className="flex h-14 w-full max-w-sm items-center justify-center rounded-xl bg-leaf px-6 font-display text-base font-bold text-white shadow-premium transition-all hover:bg-leaf-hover active:scale-[0.98]"
          >
            {t("khata.emptyAction")}
          </Link>
        </div>
      ) : (
        <>
          <KhataSummary
            month={new Date().toISOString()}
            receivedPaise={summary.receivedThisMonthPaise}
            lockedPaise={summary.lockedPaise}
            inTransitCount={summary.inTransitCount}
          />
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card divide-y divide-line/60">
            {summary.rows.map((entry) => (
              <KhataRow key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
