// Grades a scanned crop (SPEC.md §5.4, §4.6). Called by the outbox
// (app/src/services/grading.ts) once a scan's photos have finished
// uploading to `crop-photos`. Thin by design (CLAUDE.md §4) - the real work
// is integrations/ai/gradeCrop and the rules in _shared/domain.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { GradeRequest, needsHumanCheck } from "../_shared/domain/schemas/grade.ts";
import { gradeCrop } from "../_shared/integrations/ai/index.ts";

Deno.serve(
  handle(async (req) => {
    const user = await requireRole(req, ["farmer"]);
    const input = GradeRequest.parse(await req.json());

    // A farmer can only ever grade their own photos - the uid-folder is the
    // same trust boundary the crop-photos RLS policies check.
    for (const path of input.photoPaths) {
      if (!path.startsWith(`${user.id}/`)) throw new AppError("PHOTO_NOT_OWNED", 403);
    }

    // The id was made on the phone (SPEC.md §5.6). A retried request (outbox
    // backoff) re-sends the same id, so this is "insert if missing" - it
    // never overwrites a row already in progress or done.
    const { error: upsertError } = await db
      .from("grade_results")
      .upsert(
        { id: input.gradeResultId, farmer_id: user.id, crop: input.crop, photo_paths: input.photoPaths },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (upsertError) throw new AppError("INTERNAL", 500, upsertError.message);

    const { data: signed, error: signError } = await db.storage
      .from("crop-photos")
      .createSignedUrls(input.photoPaths, 60);
    if (signError || !signed) throw new AppError("PHOTO_NOT_FOUND", 404, signError?.message);
    const missing = signed.find((row) => row.error);
    if (missing) throw new AppError("PHOTO_NOT_FOUND", 404, missing.error ?? undefined);

    try {
      const result = await gradeCrop({
        crop: input.crop,
        imageUrls: signed.map((row) => row.signedUrl),
      });

      await db
        .from("grade_results")
        .update({
          status: "done",
          grade: result.grade,
          confidence: result.confidence,
          size_label: result.size.label,
          colour_pct: result.colour.healthyPct,
          damage_pct: result.damagePct,
          needs_human_check: needsHumanCheck(result.confidence),
          source: result.source,
        })
        .eq("id", input.gradeResultId);

      return json({ ok: true, data: result });
    } catch (err) {
      await db.from("grade_results").update({ status: "failed" }).eq("id", input.gradeResultId);
      if (err instanceof AppError) throw err;
      throw new AppError("AI_UNAVAILABLE", 502);
    }
  }),
);
