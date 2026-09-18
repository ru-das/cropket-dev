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
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <span className="font-display text-hero font-bold tracking-tight text-ink">{value}</span>
        <span className="rounded-full bg-leaf-light px-3 py-1 font-display text-body font-semibold text-leaf-dark shadow-xs">
          {unit}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === null ? (
            <span key={i} aria-hidden="true" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "⌫" ? t("lots.backspace") : key}
              className="flex h-16 items-center justify-center rounded-2xl border border-line bg-surface font-display text-title font-bold text-ink shadow-card transition-all duration-120 hover:border-leaf/40 hover:bg-surface-subtle active:scale-95 active:bg-leaf-light active:text-leaf-dark"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
