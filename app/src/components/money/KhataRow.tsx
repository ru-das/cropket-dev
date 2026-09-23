// One row in the Digital Khata list (SPEC.md §4.15, §5.6 `KhataRow`).
// DESIGN.md §6 forbids the side-tab "▌" colour bar SPEC.md §6.4 draws -
// colour lives in a tinted squircle icon badge instead, same pattern
// BigTile/LotCard already use, so colour is never the only signal (icon +
// word + 🔊 together, DESIGN.md pillar 3).
import { useTranslation } from "react-i18next";
import { Lock, Truck, CheckCircle2, AlertTriangle, type LucideIcon } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import VoiceButton from "@/components/voice/VoiceButton";
import type { KhataEntry } from "@/services/khata";

const COLOUR_STYLES: Record<
  KhataEntry["colour"],
  { icon: LucideIcon; box: string; border: string; text: string }
> = {
  yellow: { icon: Lock, box: "bg-haldi-light", border: "border-haldi/20", text: "text-haldi-text" },
  blue: { icon: Truck, box: "bg-neel-light", border: "border-neel/20", text: "text-neel-text" },
  green: { icon: CheckCircle2, box: "bg-pass-light", border: "border-pass/20", text: "text-pass-text" },
  red: { icon: AlertTriangle, box: "bg-mirchi-light", border: "border-mirchi/20", text: "text-mirchi-text" },
};

const DATE_FORMAT_OPTS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "Asia/Kolkata" };

export default function KhataRow({ entry }: { entry: KhataEntry }) {
  const { t, i18n } = useTranslation();
  const style = COLOUR_STYLES[entry.colour];
  const Icon = style.icon;
  const statusLabel = t(`khata.status.${entry.colour}`);
  // A titleKey the app doesn't recognise yet (or one with no crop/kg
  // parsed) falls back to just the status word - never a crash, never blank.
  const title =
    entry.titleKey && entry.crop && entry.quantityKg !== null
      ? t(entry.titleKey, { crop: t(`crop.${entry.crop}`), quantityKg: entry.quantityKg })
      : null;
  const dateLabel = new Intl.DateTimeFormat(i18n.language, DATE_FORMAT_OPTS).format(new Date(entry.createdAt));

  return (
    <div className="flex items-center gap-3.5 p-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${style.box} ${style.border} ${style.text}`}
      >
        <Icon aria-hidden="true" size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-display text-base font-bold ${style.text}`}>{statusLabel}</span>
          <span className="font-display text-lg font-black text-ink tabular-nums">
            {formatRupees(entry.amountPaise)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate font-body text-sm text-ink-muted">{title}</span>
          <span className="shrink-0 font-body text-sm text-ink-muted">{dateLabel}</span>
        </div>
      </div>

      <VoiceButton
        textKey="khata.rowSpoken"
        values={{ status: statusLabel, amount: formatRupees(entry.amountPaise), title: title ?? "" }}
        className="h-12 w-12 shrink-0 shadow-xs"
      />
    </div>
  );
}
