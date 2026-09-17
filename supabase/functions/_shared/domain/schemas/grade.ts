// Shapes for a `grade_results` row (SPEC.md §5.6) and the `grade` Edge
// Function's input/output (SPEC.md §5.4, §5.5). Pure TypeScript + zod only
// (CLAUDE.md §4 "shared domain code") - used by the app and by the `grade`
// function and its `integrations/ai` adapter.
import { z } from "zod";
import { Crop } from "../crops.ts";

export const Grade = z.enum(["A", "B", "C"]);
export type Grade = z.infer<typeof Grade>;

// What the app sends to the `grade` Edge Function. Photo paths are storage
// paths in `crop-photos` (`{uid}/{blobId}.jpg`), not URLs - the function
// signs them itself.
export const GradeRequest = z.object({
  gradeResultId: z.uuid(),
  crop: Crop,
  photoPaths: z.array(z.string().min(1)).min(1).max(3),
});
export type GradeRequest = z.infer<typeof GradeRequest>;

// The AI `/grade` response shape (SPEC.md §5.5), plus `source` so both
// integrations/ai/mock.ts and real.ts are validated against the same schema
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
export const AiGradeResult = z.object({
  grade: Grade,
  confidence: z.number().min(0).max(100),
  size: z.object({ label: z.string(), mmAvg: z.number().nullable() }),
  colour: z.object({ label: z.string(), healthyPct: z.number() }),
  damagePct: z.number().min(0).max(100),
  source: z.enum(["mock", "ai"]),
});
export type AiGradeResult = z.infer<typeof AiGradeResult>;

/** SPEC.md §4.6: below 70% confidence, the lot is marked "needs human check". */
export function needsHumanCheck(confidence: number): boolean {
  return confidence < 70;
}
