// Big 4-box delivery code (SPEC.md §4.14, §5.1 component table "OtpDigits |
// digits | Big 4-box code (buyer)"). DESIGN.md §4.1 puts OTP display in the
// hero numeral scale; §5.6 gives the OTP look (tabular Baloo 2 numerals,
// wide tracking) for a text input - this is a read-only display, so it's 4
// separate boxes instead, the shape SPEC's own mockup draws
// ("[ 4 ][ 8 ][ 1 ][ 7 ]"), each an icon-badge-style tile per DESIGN.md's
// anti-pattern checklist (no flat paper boxes, no side-tab borders).
import { cn } from "@/lib/utils";

type Props = {
  digits: string;
  className?: string;
};

export default function OtpDigits({ digits, className }: Props) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2.5", className)}
      aria-label={digits.split("").join(" ")}
    >
      {digits.split("").map((digit, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex h-16 w-14 items-center justify-center rounded-2xl border-2 border-line bg-surface font-display text-hero font-black tabular-nums text-ink shadow-card"
        >
          {digit}
        </div>
      ))}
    </div>
  );
}
