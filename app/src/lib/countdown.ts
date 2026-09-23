// Pure "time left" formatting for the auto-release timer (SPEC.md §5.1
// Countdown component, §9.2 Phase 4 "4.9"). No React here so this is
// unit-testable on its own - the component is components/money/Countdown.tsx.

/** "23:14:05" from a millisecond duration. Never negative - a passed
 * deadline clamps to "00:00:00" (the cron can take up to 15 minutes to
 * actually release after this hits zero, Countdown.tsx shows a different
 * message then, not a negative clock). */
export function formatCountdown(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
