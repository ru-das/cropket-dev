// Admin "Skip timer" button (SPEC.md §5.2, §8.6, §9.2 Phase 4 "4.9") - only
// works when DEMO_MODE=true, so a demo doesn't have to wait up to 24h (or
// up to 15 minutes for the next cron-auto-settle run) to show the money
// arriving. Sets the escrow's timer to now and releases it in the same
// request, instead of only moving the timer and waiting for the next cron
// tick - see the plan's "Skip timer" decision, SPEC.md §5.2.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { getEnv } from "../_shared/env.ts";
import { db } from "../_shared/db.ts";
import { releaseEscrow } from "../_shared/release.ts";
import { SkipTimerInput, SkipTimerResult } from "../_shared/domain/schemas/escrow.ts";

Deno.serve(
  handle(async (req) => {
    await requireRole(req, ["admin"]);

    // No mock for "demo mode" itself - unlike a missing integration key,
    // this isn't a service to fall back to a mock adapter for. Off by
    // default (fail closed, CLAUDE.md §5) so a real deployment can never
    // skip the real 24h wait by accident.
    if (getEnv("DEMO_MODE") !== "true") throw new AppError("DEMO_ONLY", 403);

    const input = SkipTimerInput.parse(await req.json());

    // Conditional update, not a plain select-then-update: only a
    // DELIVERED escrow's timer can be skipped (same state releaseEscrow()
    // itself requires) - no row matching means either the id doesn't
    // exist or the escrow isn't DELIVERED, both reported the same way.
    const { data: updated, error: updateError } = await db
      .from("escrows")
      .update({ auto_release_at: new Date().toISOString() })
      .eq("id", input.escrowId)
      .eq("state", "DELIVERED")
      .select("id")
      .maybeSingle();
    if (updateError) throw new AppError("INTERNAL", 500, updateError.message);
    if (!updated) throw new AppError("ESCROW_WRONG_STATE", 409);

    const released = await releaseEscrow(input.escrowId, "timer_skipped");

    return json({
      ok: true,
      data: SkipTimerResult.parse({ state: released.state, autoReleaseAt: released.auto_release_at }),
    });
  }),
);
