// Stand-in for a shell route that doesn't have a real screen yet, so the
// bottom nav has somewhere to go. Each real page (0.5-0.7) replaces one use
// of this; delete the file once the last one is gone.
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

type PlaceholderPageProps = {
  /** i18n key for the screen title, e.g. "nav.lots". */
  titleKey: "nav.lots" | "nav.khata" | "home.scanCrop" | "home.todaysPrice" | "bids.consentTitle";
};

export default function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black tracking-tight text-ink">{t(titleKey)}</h1>

      <div className="rounded-3xl border-2 border-dashed border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-line bg-surface-subtle text-ink-muted">
          <Clock size={28} aria-hidden="true" />
        </div>
        <p className="mt-4 font-display text-xl font-bold text-ink">{t("common.comingSoon")}</p>
      </div>
    </div>
  );
}
