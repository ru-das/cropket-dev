// Pure key-press logic for NumberPad.tsx (SPEC.md §4.7 wireframe, §5.1
// "NumberPad"). Split out so the digit/backspace rules are unit tested with
// no React - same split as components/camera/frame.ts / SmartFrameCamera.tsx.

// 100000 kg is the `lots.quantity_kg` ceiling (the lots migration) - 6 digits.
export const MAX_DIGITS = 6;

/** Appends one digit. Typing "5" from "0" gives "5", not "05" - only replaces a lone "0". */
export function pressDigit(value: string, digit: string): string {
  if (value.length >= MAX_DIGITS) return value;
  if (value === "0") return digit;
  return value + digit;
}

/** Removes the last digit. An empty pad shows "0", never "". */
export function pressBackspace(value: string): string {
  return value.length <= 1 ? "0" : value.slice(0, -1);
}
