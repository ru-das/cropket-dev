// One row on My Lots (SPEC.md §5.1 "LotCard", farmer view). Text-only - no
// thumbnail - so a long list doesn't fire one signed-URL request per row;
// the buyer view with a photo and distance is 3.2's job, not this one.
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import GradeBadge from "@/components/lot/GradeBadge";
import type { LotView } from "@/services/lots";

export default function LotCard({ lot }: { lot: LotView }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/farmer/lots/${lot.id}`}
      className="group flex min-h-20 items-center justify-between gap-4 rounded-3xl border-2 border-line bg-gradient-to-r from-surface via-surface to-surface-subtle/40 p-5 shadow-card transition-all duration-300 hover:border-leaf/50 hover:shadow-premium hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-xl font-black text-ink">
          {t(`crop.${lot.crop}`)} · {lot.quantityKg} {t("lots.kg")}
        </span>
        <span className="font-display text-sm font-semibold text-ink-muted">
          {lot.qrCode} · {t(`lots.status.${lot.status}`)}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {lot.grade && <GradeBadge grade={lot.grade} kind="indicative" size="sm" />}
        {lot.syncFailed ? (
          <span className="rounded-full border border-mirchi/40 bg-mirchi-light px-3.5 py-0.5 font-display text-xs font-bold text-mirchi-text shadow-xs">
            {t("lots.notSaved")}
          </span>
        ) : (
          lot.pending && (
            <span className="rounded-full border border-kesar/40 bg-kesar-light px-3.5 py-0.5 font-display text-xs font-bold text-kesar-text shadow-xs">
              {t("lots.onPhoneOnly")}
            </span>
          )
        )}
      </div>
    </Link>
  );
}
