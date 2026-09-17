// Calls the real AI service's POST /grade (SPEC.md §5.5). 1.4 builds that
// route; until then a real call here 502s with AI_UNAVAILABLE, which is the
// honest CLAUDE.md §5 behaviour - a set key that fails is never quietly
// swapped for a mock answer. Set INTEGRATIONS_MOCK=ai instead while the AI
// service has no /grade route yet.
import type { AiGradeResult } from "../../domain/schemas/grade.ts";
import type { GradeCropInput } from "./types.ts";
import { requireEnv } from "../../env.ts";
import { AppError } from "../../http.ts";

export async function gradeCrop(input: GradeCropInput): Promise<AiGradeResult> {
  const url = requireEnv("AI_SERVICE_URL");
  const key = requireEnv("AI_SERVICE_KEY");

  let res: Response;
  try {
    res = await fetch(`${url}/grade`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Service-Key": key },
      body: JSON.stringify({ crop: input.crop, images: input.imageUrls }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new AppError("AI_UNAVAILABLE", 502, err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) throw new AppError("AI_UNAVAILABLE", 502, `AI service returned ${res.status}`);
  return await res.json();
}
