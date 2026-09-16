// Home screen tile (SPEC.md §5.1, §4.4): icon + word + 🔊, ≥ 56 px tap target.
// A <button> (VoiceButton) can't nest inside an <a> (Link), so the Link is
// stretched over the whole card (position: absolute, inset-0) and
// VoiceButton sits on top as a later sibling - both stay tappable.
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import VoiceButton from "@/components/voice/VoiceButton";

type Props = {
  icon: LucideIcon;
  labelKey: "home.scanCrop" | "home.myLots" | "home.todaysPrice" | "home.myKhata";
  href: string;
};

export default function BigTile({ icon: Icon, labelKey, href }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface p-4 text-center">
      <Link to={href} className="absolute inset-0" aria-label={t(labelKey)} />
      <Icon aria-hidden="true" size={28} className="pointer-events-none text-leaf-dark" />
      <span className="pointer-events-none text-body font-semibold text-ink">{t(labelKey)}</span>
      <VoiceButton textKey={labelKey} className="relative z-10 h-8 w-8" />
    </div>
  );
}
