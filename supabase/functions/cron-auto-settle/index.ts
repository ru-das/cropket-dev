// The 24h auto-release timer (SPEC.md §5.2, §5.7, §9.2 Phase 4 "4.9"). Runs
// every 15 minutes (pg_cron, 20260923231500_auto_settle.sql): releases
// every DELIVERED escrow whose auto_release_at has passed. "No open
// dispute" (SPEC §5.7's transition table) is the same thing as "still
// DELIVERED" in this prototype - the disputes table doesn't exist yet
// (Phase 5), and release_escrow() (4.8) refuses anything that isn't
// DELIVERED, so a DISPUTED escrow (once that state exists) can never be
// picked up here.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { releaseEscrow } from "../_shared/release.ts";
import { AutoSettleResult } from "../_shared/domain/schemas/escrow.ts";

Deno.serve(
  handle(async (req) => {
    requireCronSecret(req);

    const { data: due, error: dueError } = await db
      .from("escrows")
      .select("id")
      .eq("state", "DELIVERED")
      .lte("auto_release_at", new Date().toISOString())
      .order("auto_release_at", { ascending: true })
      .limit(50);
    if (dueError) throw new AppError("INTERNAL", 500, dueError.message);

    // One escrow at a time, each its own all-or-nothing release
    // (releaseEscrow already wraps split + DB in one flow). A single bad
    // escrow (for example the still-open mega-lot gap, NOT_IMPLEMENTED)
    // must not block every other farmer's money - it's logged and left
    // DELIVERED, tried again on the next run, while the rest of the batch
    // keeps going. This is per-item isolation, not "catch and continue" on
    // a single money flow (CLAUDE.md §5) - each escrow's own release is
    // still all-or-nothing; only the *loop* tolerates one item failing.
    let released = 0;
    let failed = 0;
    for (const row of due ?? []) {
      try {
        await releaseEscrow(row.id, "timer");
        released += 1;
      } catch (err) {
        failed += 1;
        console.error(
          JSON.stringify({
            fn: "cron-auto-settle",
            code: err instanceof AppError ? err.code : "INTERNAL",
            escrowId: row.id,
          }),
        );
      }
    }

    return json({ ok: true, data: AutoSettleResult.parse({ released, failed }) });
  }),
);
