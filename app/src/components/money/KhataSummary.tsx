// Top summary card on the Khata screen (SPEC.md §4.15 "Received in
// September / ₹24,300 / 🟡 Locked / 🔵 On the way"). DESIGN.md §5.5 hero
// card treatment (shadow-hero, big Baloo 2 numeral) rather than SPEC §6's
// flat "mandi slip" style.
import { useTranslation } from "react-i18next";
import { Lock, Truck } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";

type Props = {
  month: string;
  receivedPaise: number;
  lockedPaise: number;
  inTransitCount: number;
};

const MONTH_FORMAT_OPTS: Intl.DateTimeFormatOptions = { month: "long", timeZone: "Asia/Kolkata" };

export default function KhataSummary({ month, receivedPaise, lockedPaise, inTransitCount }: Props) {
  const { t, i18n } = useTranslation();
  const monthLabel = new Intl.DateTimeFormat(i18n.language, MONTH_FORMAT_OPTS).format(new Date(month));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-hero">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-display text-sm font-bold text-ink-muted">
            {t("khata.receivedIn", { month: monthLabel })}
          </span>
          <div className="mt-1">
            <span className="font-display text-hero font-black tracking-tight text-ink tabular-nums">
              {formatRupees(receivedPaise)}
            </span>
          </div>
        </div>
        <VoiceButton
          textKey="khata.summarySpoken"
          values={{ month: monthLabel, received: formatRupees(receivedPaise), locked: formatRupees(lockedPaise) }}
          className="h-10 w-10 shadow-xs"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3.5">
        <div className="inline-flex items-center gap-2 rounded-xl bg-haldi-light px-3 py-1.5 font-display text-sm font-bold text-haldi-text border border-haldi/20">
          <Lock size={16} className="shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{t("khata.locked", { amount: formatRupees(lockedPaise) })}</span>
        </div>
        {inTransitCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-neel-light px-3 py-1.5 font-display text-sm font-bold text-neel-text border border-neel/20">
            <Truck size={16} className="shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{t("khata.onWay", { count: inTransitCount })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
