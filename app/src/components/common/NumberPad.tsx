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
      <div className="relative overflow-hidden flex items-center justify-center gap-3 rounded-3xl border-2 border-line bg-surface p-6 shadow-hero">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-leaf-light/60 blur-2xl"
        />
        <span className="relative z-10 font-display text-5xl font-black tracking-tight text-ink tabular-nums sm:text-6xl">
          {value}
        </span>
        <span className="relative z-10 rounded-full border border-leaf/35 bg-leaf-light px-4 py-1 font-display text-base font-bold text-leaf-dark shadow-xs">
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
              className="flex h-18 items-center justify-center rounded-2xl border-2 border-line bg-gradient-to-b from-surface to-surface-subtle/50 font-display text-3xl font-black text-ink shadow-card transition-all duration-200 hover:border-leaf/60 hover:bg-leaf-light/40 active:scale-90 active:bg-leaf active:text-white"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
