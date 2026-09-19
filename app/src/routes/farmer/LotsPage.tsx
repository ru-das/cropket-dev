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
        <div className="mt-8 flex flex-col items-center gap-5 rounded-3xl border-2 border-line bg-surface p-8 text-center shadow-premium">
          <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-leaf/30 bg-leaf-light text-4xl shadow-glow-leaf">
            📦
          </div>
          <p className="font-display text-lg font-bold text-ink-muted">{t("lots.empty")}</p>
          <Link
            to="/farmer/scan"
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-leaf px-6 font-display text-lg font-bold text-white shadow-premium transition-all hover:bg-leaf-hover active:scale-[0.98]"
          >
            {t("lots.emptyAction")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}
