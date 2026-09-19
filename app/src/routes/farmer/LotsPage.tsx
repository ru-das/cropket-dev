// My Lots (SPEC.md §4.4 tile, §3.1 route table "works offline"). Pending
// (still-on-the-phone) lots show first, newest first, then synced lots from
// the server - both come from services/lots.ts, and the page doesn't need
// to know which is which beyond that ordering (LotCard reads `pending`).
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import VoiceButton from "@/components/voice/VoiceButton";
import LotCard from "@/components/lot/LotCard";
import DataAge from "@/components/common/DataAge";
import { useMyLots, usePendingLots } from "@/services/lots";

export default function LotsPage() {
  const { t } = useTranslation();
  const { data: pending } = usePendingLots();
  const { data: mine, dataUpdatedAt } = useMyLots();

  const lots = [...(pending ?? []), ...(mine ?? [])];
  const isEmpty = pending !== undefined && mine !== undefined && lots.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header bar with count & scan action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-3xl font-black text-ink">{t("nav.lots")}</h1>
          {lots.length > 0 && (
            <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 font-display text-xs font-bold text-ink-muted border border-line tabular-nums">
              {lots.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/scan"
            className="flex h-11 items-center justify-center rounded-xl bg-leaf px-4 font-display text-sm font-bold text-white shadow-premium transition-all hover:bg-leaf-hover active:scale-95"
          >
            {t("home.scanNow")}
          </Link>
          <VoiceButton textKey="nav.lots" className="h-11 w-11 shadow-xs" />
        </div>
      </div>

      {mine !== undefined && <DataAge updatedAt={new Date(dataUpdatedAt)} />}

      {isEmpty ? (
        <div className="relative overflow-hidden mt-6 flex flex-col items-center gap-5 rounded-2xl border border-line bg-surface p-8 text-center shadow-card transition-all duration-300">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-leaf/30 bg-leaf-light text-4xl shadow-xs"
          >
            📦
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink">{t("lots.empty")}</p>
            <p className="font-display text-sm text-ink-muted mt-1">{t("home.scanCropDesc")}</p>
          </div>
          <Link
            to="/farmer/scan"
            className="flex h-14 w-full max-w-sm items-center justify-center rounded-xl bg-leaf px-6 font-display text-base font-bold text-white shadow-premium transition-all hover:bg-leaf-hover active:scale-[0.98]"
          >
            {t("lots.emptyAction")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card divide-y divide-line/60">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}

