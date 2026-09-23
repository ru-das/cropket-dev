// "Auto-release in 23:14:05" (SPEC.md §5.1 component table, §9.2 Phase 4
// "4.9") - shown on the farmer's Sold card and the buyer's deal page once
// an escrow is DELIVERED. Ticks once a second, same setInterval pattern
// LoginPage's resend timer uses. The deadline always comes from the
// server (`auto_release_at`, set by escrow_transition() when the escrow
// reached DELIVERED) - a wrong phone clock only changes what this shows,
// never when the money actually moves (CLAUDE.md §4 "timers use server
// time, never phone time"). At zero it stops counting and shows
// countdown.soon instead of "00:00:00" or a negative time, since
// cron-auto-settle runs every 15 minutes (SPEC §8.2), not the instant the
// timer hits zero.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { Clock } from "lucide-react";
import { formatCountdown } from "@/lib/countdown";
import VoiceButton from "@/components/voice/VoiceButton";

type Props = {
  until: Date | string;
  labelKey: ParseKeys;
};

export default function Countdown({ until, labelKey }: Props) {
  const { t } = useTranslation();
  const deadline = typeof until === "string" ? new Date(until) : until;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = deadline.getTime() - now.getTime();
  const done = msLeft <= 0;
  const activeKey = done ? "countdown.soon" : labelKey;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-haldi/40 bg-haldi-light px-4 py-3.5 shadow-glow-haldi">
      <div className="flex items-center gap-2">
        <Clock aria-hidden="true" size={18} className="text-haldi-text" />
        <p className="font-display text-meta font-bold text-haldi-text">{t(activeKey)}</p>
        <VoiceButton textKey={activeKey} className="h-8 w-8 shadow-xs" />
      </div>
      {!done && (
        <p className="font-display text-2xl font-black tabular-nums text-haldi-text">
          {formatCountdown(msLeft)}
        </p>
      )}
    </div>
  );
}
