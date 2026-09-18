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

const CATEGORY_STYLES: Record<Props["labelKey"], string> = {
  "home.scanCrop": "bg-leaf-light text-leaf-dark border-leaf/20",
  "home.myLots": "bg-neel-light text-neel-text border-neel/20",
  "home.todaysPrice": "bg-haldi-light text-haldi-text border-haldi/20",
  "home.myKhata": "bg-soil-light text-soil border-soil/20",
};

export default function BigTile({ icon: Icon, labelKey, href }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-32 flex-col items-center justify-between rounded-2xl border border-line bg-surface p-4 text-center shadow-card transition-all duration-150 ease-out hover:border-leaf/40 active:scale-[0.97] has-[a:active]:scale-[0.97]">
      <Link to={href} className="absolute inset-0" aria-label={t(labelKey)} />
      <div
        className={cn(
          "pointer-events-none flex h-13 w-13 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-150",
          CATEGORY_STYLES[labelKey],
        )}
      >
        <Icon aria-hidden="true" size={26} />
      </div>
      <span className="pointer-events-none mt-2 text-body font-semibold text-ink leading-tight">
        {t(labelKey)}
      </span>
      <VoiceButton textKey={labelKey} className="relative z-10 mt-2 h-9 w-9" />
    </div>
  );
}
