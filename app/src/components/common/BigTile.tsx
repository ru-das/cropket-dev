// Home screen tile (SPEC.md §5.1, §4.4): icon + word, ≥ 56 px tap target.
// No 🔊 speaker yet - VoiceButton + clipId land in 0.7; this file gets a
// `clipId` prop then.
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  labelKey: "home.scanCrop" | "home.myLots" | "home.todaysPrice" | "home.myKhata";
  href: string;
};

export default function BigTile({ icon: Icon, labelKey, href }: Props) {
  const { t } = useTranslation();

  return (
    <Link
      to={href}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface p-4 text-center"
    >
      <Icon aria-hidden="true" size={28} className="text-leaf-dark" />
      <span className="text-body font-semibold text-ink">{t(labelKey)}</span>
    </Link>
  );
}
