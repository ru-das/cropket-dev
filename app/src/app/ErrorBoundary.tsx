// Catches any render crash below it and shows a calm message instead of a
// white screen (CLAUDE.md §5 "never show stack traces"). Wraps the whole
// router in main.tsx, so a bug on one screen doesn't take the app down.
import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

function ErrorFallback({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-field p-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 text-center">
        <p className="text-body text-ink">{t("errors.unknown")}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-4 h-14 w-full rounded-button bg-leaf px-6 text-body font-semibold text-white"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    </div>
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
