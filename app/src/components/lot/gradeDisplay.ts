// Pure display helpers for the grade result screen (SPEC.md §4.6). Kept next
// to the components that use them, same split as components/camera/frame.ts:
// logic here is unit tested, GradeBadge/GradeBreakdown/ScanResultPage stay
// dumb JSX around it.
import type { Database } from "@/lib/database.types";

export type GradeResult = Database["public"]["Tables"]["grade_results"]["Row"];

// The DB columns below are nullable (they don't exist until the grade
// function fills them in), but it always writes them together in the same
// update that sets status="done" - so "done" really means all of them are
// present. This type + guard let the result screen render without `!`
// assertions once it has checked.
export type DoneGradeResult = GradeResult & {
  grade: string;
  confidence: number;
  size_label: string;
  colour_pct: number;
  damage_pct: number;
};

export function isDoneGrade(row: GradeResult): row is DoneGradeResult {
  return (
    row.status === "done" &&
    row.grade !== null &&
    row.confidence !== null &&
    row.size_label !== null &&
    row.colour_pct !== null &&
    row.damage_pct !== null
  );
}

export type GradeViewState = "loading" | "waiting" | "waitingOffline" | "failed" | "done";

/**
 * Which state the result screen is in - a switch instead of nested
 * ternaries. `row` is `null` before the `grade` function has even upserted
 * its `pending` row yet (the phone only knows the draft id it made).
 */
export function gradeView(
  row: GradeResult | null | undefined,
  isLoading: boolean,
  online: boolean,
): GradeViewState {
  if (isLoading) return "loading";
  if (!row || row.status === "pending") return online ? "waiting" : "waitingOffline";
  if (isDoneGrade(row)) return "done";
  return "failed";
}

// Bar fill for the size row (SPEC.md §4.6 mockup: "Medium" reads as ~80%
// filled). AiGradeResult's zod schema allows any string for size.label (only
// ai-service/app/grading/onion.py actually emits small/medium/large) - an
// unrecognised value shows an empty bar rather than guessing.
const KNOWN_SIZE_LABELS = new Set(["small", "medium", "large"]);
const SIZE_FRACTION: Record<string, number> = { small: 0.35, medium: 0.8, large: 1 };

export type SizeLabel = "small" | "medium" | "large" | "unknown";

/** Maps any size_label string to a known translation key (see above). */
export function normalizeSizeLabel(label: string): SizeLabel {
  return KNOWN_SIZE_LABELS.has(label) ? (label as SizeLabel) : "unknown";
}

export function sizeFraction(label: string): number {
  const known = normalizeSizeLabel(label);
  return known === "unknown" ? 0 : SIZE_FRACTION[known];
}

export type ColourLabel = "good" | "fair" | "poor";

/** SPEC.md §4.6 mockup: 90% healthy reads as "Good". */
export function colourLabelFor(healthyPct: number): ColourLabel {
  if (healthyPct >= 85) return "good";
  if (healthyPct >= 65) return "fair";
  return "poor";
}
