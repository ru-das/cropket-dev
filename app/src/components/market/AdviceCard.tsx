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
      className={`flex flex-col gap-3.5 rounded-3xl border-2 p-5 shadow-card transition-all ${
        isHold
          ? "border-haldi/40 bg-surface"
          : "border-pass/40 bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
              isHold
                ? "border-haldi/40 bg-haldi-light text-haldi-text shadow-glow-haldi"
                : "border-pass/40 bg-pass-light text-pass-text shadow-glow-leaf"
            }`}
          >
            {isHold ? (
              <Hourglass aria-hidden="true" size={24} className="stroke-[2.5]" />
            ) : (
              <ShoppingBasket aria-hidden="true" size={24} className="stroke-[2.5]" />
            )}
          </div>
          <span className="font-display text-2xl font-black text-ink leading-tight">
            {headline}
          </span>
        </div>
        <VoiceButton textKey="advice.spoken" values={{ headline, reasons }} className="h-10 w-10 shadow-xs" />
      </div>

      {reasons.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface-subtle p-3.5 text-sm text-ink-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
          <p className="font-display font-semibold leading-relaxed text-ink">
            {t("advice.why", { reasons })}
          </p>
        </div>
      )}

      <div>
        <DemoDataTag />
      </div>
    </div>
  );
}
