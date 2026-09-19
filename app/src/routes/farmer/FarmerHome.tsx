// Farmer home (SPEC.md §4.4). The money strip ("🟡 ₹9,600 locked safely")
// needs Khata data from milestone 4.4 - left out until then, not faked.
import { useTranslation } from "react-i18next";
import { Camera, Package, TrendingUp, BookText } from "lucide-react";
import { useAuth } from "@/app/authContext";
import BigTile from "@/components/common/BigTile";
import VoiceButton from "@/components/voice/VoiceButton";

export default function FarmerHome() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const name = profile?.name ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-meta text-ink-muted">{t("app.name")}</p>
          <p className="text-title font-display text-ink">{t("home.greeting", { name })}</p>
        </div>
        <VoiceButton textKey="home.greeting" values={{ name }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BigTile icon={Camera} labelKey="home.scanCrop" href="/farmer/scan" accent="leaf" />
        <BigTile icon={Package} labelKey="home.myLots" href="/farmer/lots" accent="haldi" />
        <BigTile icon={TrendingUp} labelKey="home.todaysPrice" href="/farmer/prices" accent="neel" />
        <BigTile icon={BookText} labelKey="home.myKhata" href="/farmer/khata" accent="kesar" />
      </div>
    </div>
  );
}
