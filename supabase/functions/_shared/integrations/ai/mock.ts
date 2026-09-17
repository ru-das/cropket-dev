// Fake AI /grade response - the SPEC.md §4.6 mockup grade (Grade B, 82%
// sure, medium size, good colour, 5% damage). Used until 1.4 builds the real
// onion grading service, and afterward whenever INTEGRATIONS_MOCK=ai is set.
import type { AiGradeResult } from "../../domain/schemas/grade.ts";
import type { GradeCropInput } from "./types.ts";

export function gradeCrop(_input: GradeCropInput): Promise<AiGradeResult> {
  return Promise.resolve({
    grade: "B",
    confidence: 82,
    size: { label: "medium", mmAvg: 42 },
    colour: { label: "good", healthyPct: 90 },
    damagePct: 5,
    source: "mock",
  });
}
