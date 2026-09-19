// One row on My Lots (SPEC.md §5.1 "LotCard", farmer view). Text-only - no
// thumbnail - so a long list doesn't fire one signed-URL request per row;
// the buyer view with a photo and distance is 3.2's job, not this one.
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import GradeBadge from "@/components/lot/GradeBadge";
import type { LotView } from "@/services/lots";

export default function LotCard({ lot }: { lot: LotView }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/farmer/lots/${lot.id}`}
      className="group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-subtle/50 active:bg-surface-subtle"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Crop avatar container */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-line text-2xl group-hover:border-leaf/40 transition-colors">
          {lot.crop === "onion" ? "🧅" : lot.crop === "tomato" ? "🍅" : "🥔"}
        </div>

        {/* Text information */}
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-display text-lg font-black text-ink truncate">
              {t(`crop.${lot.crop}`)}
            </span>
            <span className="font-display text-base font-bold text-ink tabular-nums">
              · {lot.quantityKg} {t("lots.kg")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-display text-xs font-semibold text-ink-muted truncate">
            <span>{lot.qrCode}</span>
            <span>•</span>
            <span className="rounded-md bg-surface-subtle px-1.5 py-0.2 border border-line/60">
              {t(`lots.status.${lot.status}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Right meta & action */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex flex-col items-end gap-1">
          {lot.grade && <GradeBadge grade={lot.grade} kind="indicative" size="sm" />}
          {lot.syncFailed ? (
            <span className="rounded-full border border-mirchi/40 bg-mirchi-light px-2.5 py-0.5 font-display text-xs font-bold text-mirchi-text">
              {t("lots.notSaved")}
            </span>
          ) : (
            lot.pending && (
              <span className="rounded-full border border-kesar/40 bg-kesar-light px-2.5 py-0.5 font-display text-xs font-bold text-kesar-text">
                {t("lots.onPhoneOnly")}
              </span>
            )
          )}
        </div>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="text-ink-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </div>
    </Link>
  );
}
