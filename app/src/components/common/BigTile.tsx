// Home screen tile (SPEC.md §5.1, §4.4): icon + word + 🔊, ≥ 56 px tap target.
// A <button> (VoiceButton) can't nest inside an <a> (Link), so the Link is
// stretched over the whole card (position: absolute, inset-0) and
// VoiceButton sits on top as a later sibling - both stay tappable.
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import VoiceButton from "@/components/voice/VoiceButton";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  labelKey: "home.scanCrop" | "home.myLots" | "home.todaysPrice" | "home.myKhata";
  href: string;
  badge?: string;
  descKey?: "home.myLotsDesc" | "home.todaysPriceDesc" | "home.myKhataDesc";
};

const CATEGORY_STYLES: Record<
  Props["labelKey"],
  { box: string; icon: string; border: string }
> = {
  "home.scanCrop": {
    box: "bg-leaf-light",
    icon: "text-leaf-dark",
    border: "border-leaf/20",
  },
  "home.myLots": {
    box: "bg-neel-light",
    icon: "text-neel-text",
    border: "border-neel/20",
  },
  "home.todaysPrice": {
    box: "bg-haldi-light",
    icon: "text-haldi-text",
    border: "border-haldi/20",
  },
  "home.myKhata": {
    box: "bg-terracotta-light",
    icon: "text-terracotta-dark",
    border: "border-terracotta/20",
  },
};

export default function BigTile({ icon: Icon, labelKey, href, badge, descKey }: Props) {
  const { t } = useTranslation();
  const style = CATEGORY_STYLES[labelKey];

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:border-leaf/50 hover:shadow-premium active:scale-[0.98]">
      <Link to={href} className="absolute inset-0 z-0" aria-label={t(labelKey)} />

      {/* Top row: Icon + VoiceButton / Badge */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
            style.box,
            style.border,
            style.icon,
          )}
        >
          <Icon aria-hidden="true" size={24} className="stroke-[2.2]" />
        </div>

        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded-full bg-leaf-light px-2.5 py-0.5 font-display text-xs font-bold text-leaf-dark border border-leaf/25">
              {badge}
            </span>
          )}
          <VoiceButton textKey={labelKey} className="h-8 w-8 shadow-xs" />
        </div>
      </div>

      {/* Content */}
      <div className="pointer-events-none relative z-10 mt-3 flex flex-col text-left">
        <span className="font-display text-base font-bold text-ink leading-snug">
          {t(labelKey)}
        </span>
        {descKey && (
          <span className="font-display text-xs font-semibold text-ink-muted leading-tight mt-0.5">
            {t(descKey)}
          </span>
        )}
      </div>
    </div>
  );
}
