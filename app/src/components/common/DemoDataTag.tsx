// Small "Demo data" chip (CLAUDE.md §4/§5 honesty rule): shown next to any
// value whose `source` is a mock, so a mocked reading is never mistaken for
// a real one. Reused by every mocked screen from here on (grade, later
// prices, KYC, Cashfree), which is why it lives in common/, not lot/.
import { useTranslation } from "react-i18next";

export default function DemoDataTag() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-kesar/30 bg-kesar-light px-2.5 py-0.5 text-meta font-medium text-kesar-text shadow-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-kesar" />
      {t("common.demoData")}
    </span>
  );
}
