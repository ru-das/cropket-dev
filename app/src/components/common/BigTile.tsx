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
  /** Accent colour for the icon circle, keyed by tile position. */
  accent?: "leaf" | "haldi" | "neel" | "kesar";
};

const ACCENT_BG: Record<NonNullable<Props["accent"]>, string> = {
  leaf: "bg-leaf/10 text-leaf-dark",
  haldi: "bg-haldi/10 text-haldi-text",
  neel: "bg-neel/10 text-neel-text",
  kesar: "bg-kesar/10 text-kesar-text",
};

export default function BigTile({ icon: Icon, labelKey, href, accent = "leaf" }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-card border border-line bg-surface p-4 text-center shadow-[var(--shadow-soft)] transition-all duration-200 ease-out has-[a:active]:scale-[0.97] hover:border-leaf hover:shadow-[var(--shadow-float)]">
      <Link to={href} className="absolute inset-0" aria-label={t(labelKey)} />
      <div
        className={cn(
          "pointer-events-none flex h-12 w-12 items-center justify-center rounded-button",
          ACCENT_BG[accent],
        )}
      >
        <Icon aria-hidden="true" size={24} />
      </div>
      <span className="pointer-events-none text-body font-semibold text-ink">{t(labelKey)}</span>
      <VoiceButton textKey={labelKey} className="relative z-10 h-7 w-7" />
    </div>
  );
}
