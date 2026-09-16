// Stand-in for a shell route that doesn't have a real screen yet, so the
// bottom nav has somewhere to go. Each real page (0.5-0.7) replaces one use
// of this; delete the file once the last one is gone.
import { useTranslation } from "react-i18next";

type PlaceholderPageProps = {
  /** i18n key for the screen title, e.g. "nav.lots". */
  titleKey: "nav.lots" | "nav.khata" | "home.scanCrop" | "home.todaysPrice";
};

export default function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-title font-display text-ink">{t(titleKey)}</h1>
      <p className="mt-2 text-body text-ink-muted">{t("common.comingSoon")}</p>
    </div>
  );
}
