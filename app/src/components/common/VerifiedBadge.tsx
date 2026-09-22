// Verified-buyer badge (SPEC.md §5.1 `VerifiedBadge`, §9.2 Phase 3 "3.1").
// Lives in common/, not a new trade/ folder - same reason DemoDataTag.tsx
// does (reused wherever a buyer's name shows, starting with BuyerHome and
// later the marketplace/bid rows in 3.2/3.3). Same pill treatment as
// DemoDataTag/GradeBadge's "sm" chip - a light tint + border + text, never
// colour alone (SPEC.md §6.1).
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  verified: boolean;
  /** "sm" is a compact chip for a name row; "lg" is the KYC screen's own result card. Defaults to "sm". */
  size?: "sm" | "lg";
};

export default function VerifiedBadge({ verified, size = "sm" }: Props) {
  const { t } = useTranslation();
  const Icon = verified ? ShieldCheck : ShieldAlert;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-display font-bold shadow-xs",
        verified ? "border-pass/40 bg-pass-light text-pass-text" : "border-kesar/40 bg-kesar-light text-kesar-text",
        size === "lg" ? "px-4 py-1.5 text-base" : "px-3 py-0.5 text-xs",
      )}
    >
      <Icon aria-hidden="true" size={size === "lg" ? 18 : 14} />
      {t(verified ? "kyc.verifiedBadge" : "kyc.notVerifiedBadge")}
    </span>
  );
}
