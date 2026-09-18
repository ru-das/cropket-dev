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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-leaf/20 bg-leaf-light text-2xl shadow-xs"
          >
            🌾
          </div>
          <div>
            <p className="text-meta font-medium text-ink-muted">{t("app.name")}</p>
            <h1 className="text-title font-display font-bold leading-tight text-ink">
              {t("home.greeting", { name })}
            </h1>
          </div>
        </div>
        <VoiceButton textKey="home.greeting" values={{ name }} />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <BigTile icon={Camera} labelKey="home.scanCrop" href="/farmer/scan" />
        <BigTile icon={Package} labelKey="home.myLots" href="/farmer/lots" />
        <BigTile icon={TrendingUp} labelKey="home.todaysPrice" href="/farmer/prices" />
        <BigTile icon={BookText} labelKey="home.myKhata" href="/farmer/khata" />
      </div>
    </div>
  );
}
