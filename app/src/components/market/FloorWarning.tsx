// Reference floor price warning (SPEC.md §2.3, §2.4 FloorWarning). Warns,
// never blocks (SPEC.md §10.7, CLAUDE.md §6 "the floor price warns, never
// blocks"). The caller only renders this when isBelowFloor() is true - it
// has nothing to say otherwise.
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";

export default function FloorWarning({ floorPaise }: { floorPaise: number }) {
  const { t } = useTranslation();
  const floor = formatRupees(floorPaise);

  return (
    <div className="flex items-center gap-3.5 rounded-3xl border-2 border-mirchi/50 bg-mirchi-light p-4.5 text-mirchi-text shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-mirchi/30 bg-mirchi/15 text-mirchi-text shadow-xs">
        <AlertTriangle aria-hidden="true" size={24} className="stroke-[2.5]" />
      </div>
      <p className="flex-1 font-display text-base font-bold leading-snug">{t("floor.belowFloor", { floor })}</p>
      <VoiceButton textKey="floor.belowFloor" values={{ floor }} className="h-10 w-10 shadow-xs" />
    </div>
  );
}
