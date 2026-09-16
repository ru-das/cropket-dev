// Farmer home (SPEC.md §4.4). The money strip ("🟡 ₹9,600 locked safely")
// needs Khata data from milestone 4.4 - left out until then, not faked.
import { useTranslation } from "react-i18next";
import { Camera, Package, TrendingUp, BookText } from "lucide-react";
import { useAuth } from "@/app/authContext";
import BigTile from "@/components/common/BigTile";

export default function FarmerHome() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div>
      <p className="text-title font-display text-ink">
        {t("home.greeting", { name: profile?.name ?? "" })}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <BigTile icon={Camera} labelKey="home.scanCrop" href="/farmer/scan" />
        <BigTile icon={Package} labelKey="home.myLots" href="/farmer/lots" />
        <BigTile icon={TrendingUp} labelKey="home.todaysPrice" href="/farmer/prices" />
        <BigTile icon={BookText} labelKey="home.myKhata" href="/farmer/khata" />
      </div>
    </div>
  );
}
