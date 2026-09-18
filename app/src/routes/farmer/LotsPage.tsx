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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-title font-display font-bold text-ink">{t("nav.lots")}</h1>
        <VoiceButton textKey="nav.lots" />
      </div>

      {mine !== undefined && <DataAge updatedAt={new Date(dataUpdatedAt)} />}

      {isEmpty ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full border border-leaf/20 bg-leaf-light text-3xl shadow-xs">
            📦
          </div>
          <p className="text-body font-medium text-ink-muted">{t("lots.empty")}</p>
          <Link
            to="/farmer/scan"
            className="flex h-14 items-center justify-center rounded-xl bg-leaf px-6 text-body font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
          >
            {t("lots.emptyAction")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}
