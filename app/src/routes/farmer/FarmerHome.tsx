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
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden flex items-center justify-between gap-3 rounded-3xl border-2 border-line bg-surface p-5 shadow-hero transition-all duration-300">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-leaf-light to-terracotta-light/50 blur-2xl"
        />
        <div className="relative z-10 flex items-center gap-3.5">
          <div
            aria-hidden="true"
            className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl border-2 border-leaf/30 bg-gradient-to-br from-leaf-light to-surface text-3xl shadow-glow-leaf animate-float-gentle"
          >
            🌾
          </div>
          <div>
            <span className="font-display text-xs font-black tracking-widest text-leaf-dark uppercase">
              {t("app.name")}
            </span>
            <h1 className="font-display text-3xl font-black leading-tight text-ink">
              {t("home.greeting", { name })}
            </h1>
          </div>
        </div>
        <VoiceButton textKey="home.greeting" values={{ name }} className="relative z-10 h-11 w-11 shadow-xs" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BigTile icon={Camera} labelKey="home.scanCrop" href="/farmer/scan" />
        <BigTile icon={Package} labelKey="home.myLots" href="/farmer/lots" />
        <BigTile icon={TrendingUp} labelKey="home.todaysPrice" href="/farmer/prices" />
        <BigTile icon={BookText} labelKey="home.myKhata" href="/farmer/khata" />
      </div>
    </div>
  );
}
