// Small "Demo data" chip (CLAUDE.md §4/§5 honesty rule): shown next to any
// value whose `source` is a mock, so a mocked reading is never mistaken for
// a real one. Reused by every mocked screen from here on (grade, later
// prices, KYC, Cashfree), which is why it lives in common/, not lot/.
import { useTranslation } from "react-i18next";

export default function DemoDataTag() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center rounded-full border border-line-soft bg-field px-3 py-1 text-meta font-medium text-ink-muted">
      {t("common.demoData")}
    </span>
  );
}
