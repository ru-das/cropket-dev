// Sell / hold advice for one crop (SPEC.md §4.8 AdviceCard, §2.4 "Show the
// 'Why?' line from the signals that fired" - resolved as P0 for this screen
// alongside the same-commit SPEC.md §9.2 fix, see docs/progress.md's 2.4
// handoff note). Always carries <DemoDataTag>: the rain signal comes from
// seeded `weather_daily` rows, not a live forecast (CLAUDE.md §9.5 - the
// weather cron is out of prototype scope).
import { useTranslation } from "react-i18next";
import { Hourglass, ShoppingBasket } from "lucide-react";
import DemoDataTag from "@/components/common/DemoDataTag";
import VoiceButton from "@/components/voice/VoiceButton";
import type { Advice } from "@shared/advice.ts";

const HOLD_TONE = "border-haldi/30 bg-haldi/5";
const SELL_TONE = "border-pass/30 bg-pass/5";

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
      className={`flex flex-col gap-2.5 rounded-card border p-4 shadow-[var(--shadow-soft)] ${isHold ? HOLD_TONE : SELL_TONE}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-button ${isHold ? "bg-haldi/10 text-haldi-text" : "bg-pass/10 text-pass-text"}`}
          >
            {isHold ? (
              <Hourglass aria-hidden="true" size={18} />
            ) : (
              <ShoppingBasket aria-hidden="true" size={18} />
            )}
          </div>
          {headline}
        </span>
        <VoiceButton textKey="advice.spoken" values={{ headline, reasons }} />
      </div>
      {reasons.length > 0 && (
        <p className="text-meta text-ink-muted">{t("advice.why", { reasons })}</p>
      )}
      <DemoDataTag />
    </div>
  );
}
