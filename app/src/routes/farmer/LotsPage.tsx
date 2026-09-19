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
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-black text-ink">{t("nav.lots")}</h1>
        <VoiceButton textKey="nav.lots" className="h-11 w-11 shadow-xs" />
      </div>

      {mine !== undefined && <DataAge updatedAt={new Date(dataUpdatedAt)} />}

      {isEmpty ? (
        <div className="relative overflow-hidden mt-8 flex flex-col items-center gap-5 rounded-3xl border-2 border-line bg-surface p-8 text-center shadow-hero transition-all duration-300">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-leaf-light/60 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="relative z-10 flex h-22 w-22 items-center justify-center rounded-3xl border-2 border-leaf/30 bg-gradient-to-br from-leaf-light to-surface text-4xl shadow-glow-leaf animate-float-gentle"
          >
            📦
          </div>
          <p className="relative z-10 font-display text-lg font-bold text-ink-muted">{t("lots.empty")}</p>
          <Link
            to="/farmer/scan"
            className="relative z-10 flex h-16 w-full items-center justify-center rounded-2xl bg-leaf px-6 font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98]"
          >
            {t("lots.emptyAction")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}

