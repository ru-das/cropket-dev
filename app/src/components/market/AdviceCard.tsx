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

export default function AdviceCard({ advice }: { advice: Advice }) {
  const { t, i18n } = useTranslation();
  const headline =
    advice.action === "hold"
      ? t("advice.holdDays", { days: advice.holdDays })
      : t("advice.sellNow");
  const reasons = new Intl.ListFormat(i18n.language, { style: "long", type: "conjunction" }).format(
    advice.reasons.map((reason) => t(`advice.reason.${reason}`)),
  );

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          {advice.action === "hold" ? (
            <Hourglass aria-hidden="true" size={20} />
          ) : (
            <ShoppingBasket aria-hidden="true" size={20} />
          )}
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
