// Small "Demo data" chip (CLAUDE.md §4/§5 honesty rule): shown next to any
// value whose `source` is a mock, so a mocked reading is never mistaken for
// a real one. Reused by every mocked screen from here on (grade, later
// prices, KYC, Cashfree), which is why it lives in common/, not lot/.
import { useTranslation } from "react-i18next";

export default function DemoDataTag() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-kesar/40 bg-kesar-light px-3 py-0.5 font-display text-xs font-bold text-kesar-text shadow-xs">
      <span className="h-2 w-2 rounded-full bg-kesar shadow-glow-haldi" />
      {t("common.demoData")}
    </span>
  );
}
