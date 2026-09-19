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

const CATEGORY_STYLES: Record<Props["labelKey"], { box: string; icon: string; border: string }> = {
  "home.scanCrop": {
    box: "bg-leaf-light/90 shadow-glow-leaf",
    icon: "text-leaf-dark",
    border: "border-leaf/30",
  },
  "home.myLots": {
    box: "bg-neel-light/90",
    icon: "text-neel-text",
    border: "border-neel/30",
  },
  "home.todaysPrice": {
    box: "bg-haldi-light/90 shadow-glow-haldi",
    icon: "text-haldi-text",
    border: "border-haldi/30",
  },
  "home.myKhata": {
    box: "bg-soil-light/90",
    icon: "text-soil",
    border: "border-soil/30",
  },
};

export default function BigTile({ icon: Icon, labelKey, href }: Props) {
  const { t } = useTranslation();
  const style = CATEGORY_STYLES[labelKey];

  return (
    <div className="group relative flex min-h-36 flex-col items-center justify-between rounded-3xl border-2 border-line bg-surface p-4 text-center shadow-card transition-all duration-200 ease-out hover:border-leaf hover:shadow-premium hover:-translate-y-0.5 active:scale-[0.97] has-[a:active]:scale-[0.97]">
      <Link to={href} className="absolute inset-0 z-0" aria-label={t(labelKey)} />
      <div
        className={cn(
          "pointer-events-none flex h-15 w-15 items-center justify-center rounded-2xl border-2 transition-transform duration-200 group-hover:scale-105",
          style.box,
          style.border,
          style.icon,
        )}
      >
        <Icon aria-hidden="true" size={30} className="stroke-[2.2]" />
      </div>
      <span className="pointer-events-none mt-2 font-display text-lg font-bold text-ink leading-snug">
        {t(labelKey)}
      </span>
      <VoiceButton textKey={labelKey} className="relative z-10 mt-1 h-9 w-9 shadow-xs" />
    </div>
  );
}
