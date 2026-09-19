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
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 rounded-3xl border-2 border-line bg-surface p-5 shadow-hero">
        <span className="font-display text-5xl font-black tracking-tight text-ink tabular-nums">{value}</span>
        <span className="rounded-full border border-leaf/30 bg-leaf-light px-4 py-1 font-display text-base font-bold text-leaf-dark shadow-xs">
          {unit}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        {KEYS.map((key, i) =>
          key === null ? (
            <span key={i} aria-hidden="true" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "⌫" ? t("lots.backspace") : key}
              className="flex h-17 items-center justify-center rounded-2xl border-2 border-line bg-surface font-display text-3xl font-black text-ink shadow-card transition-all duration-150 hover:border-leaf hover:bg-leaf-light/30 active:scale-90 active:bg-leaf active:text-white"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
