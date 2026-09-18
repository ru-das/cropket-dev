// Sell / hold advice for one crop (SPEC.md §4.8 AdviceCard, §2.4 "Show the
// 'Why?' line from the signals that fired" - resolved as P0 for this screen
// alongside the same-commit SPEC.md §9.2 fix, see docs/progress.md's 2.4
// handoff note). Always carries <DemoDataTag>: the rain signal comes from
// seeded `weather_daily` rows, not a live forecast (CLAUDE.md §9.5 - the
// weather cron is out of prototype scope).
import { useTranslation } from "react-i18next";
import { Hourglass, ShoppingBasket, Info } from "lucide-react";
import DemoDataTag from "@/components/common/DemoDataTag";
import VoiceButton from "@/components/voice/VoiceButton";
import type { Advice } from "@shared/advice.ts";

export default function AdviceCard({ advice }: { advice: Advice }) {
  const { t, i18n } = useTranslation();
  const headline =
    advice.action === "hold"
      ? t("advice.holdDays", { days: advice.holdDays })
      : t("advice.sellNow");
  const reasons = new Intl.ListFormat(i18n.language, { style: "long", type: "conjunction" }).format(
    advice.reasons.map((reason) => t(`advice.reason.${reason}`)),
  );

  const isHold = advice.action === "hold";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-card ${
        isHold
          ? "border-line border-l-[6px] border-l-haldi bg-surface"
          : "border-line border-l-[6px] border-l-leaf bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isHold ? "bg-haldi-light text-haldi-text" : "bg-leaf-light text-leaf-dark"
            }`}
          >
            {isHold ? (
              <Hourglass aria-hidden="true" size={20} />
            ) : (
              <ShoppingBasket aria-hidden="true" size={20} />
            )}
          </div>
          <span className="font-display text-lg font-bold text-ink">{headline}</span>
        </div>
        <VoiceButton textKey="advice.spoken" values={{ headline, reasons }} />
      </div>

      {reasons.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-surface-subtle p-3 text-xs text-ink-muted">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
          <p className="font-medium leading-relaxed">{t("advice.why", { reasons })}</p>
        </div>
      )}

      <div>
        <DemoDataTag />
      </div>
    </div>
  );
}
