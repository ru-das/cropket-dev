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
    <div className="flex items-start gap-2 rounded-card border border-mirchi bg-mirchi/10 p-4 text-mirchi-text">
      <AlertTriangle aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-body">{t("floor.belowFloor", { floor })}</p>
      <VoiceButton textKey="floor.belowFloor" values={{ floor }} />
    </div>
  );
}
