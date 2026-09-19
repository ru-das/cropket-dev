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
};

const CATEGORY_STYLES: Record<
  Props["labelKey"],
  { box: string; icon: string; border: string; glow: string }
> = {
  "home.scanCrop": {
    box: "bg-gradient-to-br from-leaf-light via-leaf-light/80 to-surface",
    icon: "text-leaf-dark",
    border: "border-leaf/35",
    glow: "bg-leaf-light/50",
  },
  "home.myLots": {
    box: "bg-gradient-to-br from-neel-light via-neel-light/80 to-surface",
    icon: "text-neel-text",
    border: "border-neel/35",
    glow: "bg-neel-light/50",
  },
  "home.todaysPrice": {
    box: "bg-gradient-to-br from-haldi-light via-haldi-light/80 to-surface",
    icon: "text-haldi-text",
    border: "border-haldi/35",
    glow: "bg-haldi-light/50",
  },
  "home.myKhata": {
    box: "bg-gradient-to-br from-terracotta-light via-soil-light to-surface",
    icon: "text-terracotta-dark",
    border: "border-terracotta/35",
    glow: "bg-terracotta-light/50",
  },
};

export default function BigTile({ icon: Icon, labelKey, href }: Props) {
  const { t } = useTranslation();
  const style = CATEGORY_STYLES[labelKey];

  return (
    <div className="group relative flex min-h-40 flex-col items-center justify-between overflow-hidden rounded-3xl border-2 border-line bg-surface p-4.5 text-center shadow-card transition-all duration-300 ease-out hover:border-leaf/60 hover:shadow-premium hover:-translate-y-1 active:scale-[0.96] has-[a:active]:scale-[0.96]">
      {/* Organic ambient light halo behind tile */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-xl transition-opacity duration-300 group-hover:opacity-100 opacity-60",
          style.glow,
        )}
      />

      <Link to={href} className="absolute inset-0 z-0" aria-label={t(labelKey)} />
      <div
        className={cn(
          "pointer-events-none relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 shadow-xs transition-transform duration-300 group-hover:scale-105",
          style.box,
          style.border,
          style.icon,
        )}
      >
        <Icon aria-hidden="true" size={32} className="stroke-[2.2]" />
      </div>
      <span className="pointer-events-none relative z-10 mt-2.5 font-display text-lg font-bold text-ink leading-snug">
        {t(labelKey)}
      </span>
      <VoiceButton textKey={labelKey} className="relative z-10 mt-1 h-9 w-9 shadow-xs" />
    </div>
  );
}
