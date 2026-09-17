// CLAUDE.md §6 "Mock adapters: mock output passes the same zod schema as
// real (test the pure mock.ts files)". mock.ts has no Deno APIs (SPEC.md
// §2.2 adapter pattern), so it loads fine here even though it lives under
// supabase/functions/_shared, not app/.
import { describe, expect, it } from "vitest";
import { AiGradeResult } from "@shared/schemas/grade.ts";
import { gradeCrop } from "../../../../supabase/functions/_shared/integrations/ai/mock.ts";

describe("integrations/ai mock", () => {
  it("returns a result that passes AiGradeResult, the same schema real.ts must pass", async () => {
    const result = await gradeCrop({ crop: "onion", imageUrls: ["https://example.com/a.jpg"] });
    expect(AiGradeResult.safeParse(result).success).toBe(true);
  });

  it("marks itself as a mock", async () => {
    const result = await gradeCrop({ crop: "onion", imageUrls: [] });
    expect(result.source).toBe("mock");
  });
});
