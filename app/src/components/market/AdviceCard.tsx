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
      className={`relative overflow-hidden flex flex-col gap-4 rounded-3xl border-2 p-6 shadow-card transition-all duration-300 ${
        isHold
          ? "border-haldi/40 bg-surface shadow-card hover:shadow-premium"
          : "border-pass/40 bg-surface shadow-card hover:shadow-premium"
      }`}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-2xl ${
          isHold ? "bg-haldi-light/60" : "bg-pass-light/60"
        }`}
      />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 shadow-xs ${
              isHold
                ? "border-haldi/40 bg-gradient-to-br from-haldi-light to-surface text-haldi-text shadow-glow-haldi"
                : "border-pass/40 bg-gradient-to-br from-pass-light to-surface text-pass-text shadow-glow-leaf"
            }`}
          >
            {isHold ? (
              <Hourglass aria-hidden="true" size={26} className="stroke-[2.5]" />
            ) : (
              <ShoppingBasket aria-hidden="true" size={26} className="stroke-[2.5]" />
            )}
          </div>
          <span className="font-display text-2xl font-black text-ink leading-tight">
            {headline}
          </span>
        </div>
        <VoiceButton textKey="advice.spoken" values={{ headline, reasons }} className="h-11 w-11 shadow-xs" />
      </div>

      {reasons.length > 0 && (
        <div className="relative z-10 flex items-start gap-3 rounded-2xl border border-line bg-surface-subtle/80 p-4 text-sm text-ink-muted shadow-xs">
          <Info size={18} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
          <p className="font-display font-semibold leading-relaxed text-ink">
            {t("advice.why", { reasons })}
          </p>
        </div>
      )}

      <div className="relative z-10 flex items-center">
        <DemoDataTag />
      </div>
    </div>
  );
}
