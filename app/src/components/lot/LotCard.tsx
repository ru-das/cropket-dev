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
      className="flex min-h-16 items-center justify-between gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-150 hover:border-leaf/40 active:scale-[0.98]"
    >
      <div className="flex flex-col gap-1">
        <span className="text-body font-bold text-ink">
          {t(`crop.${lot.crop}`)} · {lot.quantityKg} {t("lots.kg")}
        </span>
        <span className="text-meta font-medium text-ink-muted">
          {lot.qrCode} · {t(`lots.status.${lot.status}`)}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {lot.grade && <GradeBadge grade={lot.grade} kind="indicative" size="sm" />}
        {lot.syncFailed ? (
          <span className="rounded-full border border-mirchi/30 bg-mirchi-light px-2.5 py-0.5 text-meta font-semibold text-mirchi-text shadow-xs">
            {t("lots.notSaved")}
          </span>
        ) : (
          lot.pending && (
            <span className="rounded-full border border-kesar/30 bg-kesar-light px-2.5 py-0.5 text-meta font-semibold text-kesar-text shadow-xs">
              {t("lots.onPhoneOnly")}
            </span>
          )
        )}
      </div>
    </Link>
  );
}
