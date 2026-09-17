// The only file other code imports for AI grading (SPEC.md §2.2). Picks
// mock or real and validates the answer against AiGradeResult either way
// (CLAUDE.md §5 "validate results with zod in both mock and real mode").
import { AiGradeResult } from "../../domain/schemas/grade.ts";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";
import type { GradeCropInput } from "./types.ts";

export type { GradeCropInput };

export async function gradeCrop(input: GradeCropInput): Promise<AiGradeResult> {
  const impl = isMock("ai", ["AI_SERVICE_URL", "AI_SERVICE_KEY"]) ? mock : real;
  return AiGradeResult.parse(await impl.gradeCrop(input));
}
