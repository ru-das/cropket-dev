// Big-key weight entry pad (SPEC.md §4.7 wireframe, §5.1 "NumberPad"). Pure
// digit/backspace rules live in numberPad.ts so they're unit tested with no
// React - this file is just the display line and the grid of keys. No 🎤
// key yet (MicInput is P1, SPEC.md §9.2 Phase 1 table).
import { useTranslation } from "react-i18next";
import { pressBackspace, pressDigit } from "./numberPad";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "⌫"] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  unit: string;
};

export default function NumberPad({ value, onChange, unit }: Props) {
  const { t } = useTranslation();

  function press(key: string) {
    onChange(key === "⌫" ? pressBackspace(value) : pressDigit(value, key));
  }

  return (
    <div>
      <div className="flex items-baseline justify-center gap-2 py-4">
        <span className="text-hero font-display text-ink">{value}</span>
        <span className="text-body text-ink-muted">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === null ? (
            <span key={i} aria-hidden="true" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "⌫" ? t("lots.backspace") : key}
              className="h-16 rounded-button border border-line bg-surface text-title font-semibold text-ink"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
