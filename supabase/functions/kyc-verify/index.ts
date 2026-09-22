// Buyer KYC submission (SPEC.md §5.4, §9.2 Phase 3 "3.1"). Called by the
// buyer's KYC screen (app/src/services/kyc.ts). Thin by design (CLAUDE.md
// §4) - the verify rule lives in integrations/digilocker,
// profiles.kyc_status sync happens in the buyer_kyc_sync trigger
// (20260922120000_buyer_kyc.sql), not here.
import { handle, json, AppError } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { db } from "../_shared/db.ts";
import { KycRequest } from "../_shared/domain/schemas/kyc.ts";
import { checkKyc } from "../_shared/integrations/digilocker/index.ts";

Deno.serve(
  handle(async (req) => {
    const user = await requireRole(req, ["buyer"]);
    const input = KycRequest.parse(await req.json());

    const { data: existing, error: existingError } = await db
      .from("buyer_kyc")
      .select("status")
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (existingError) throw new AppError("INTERNAL", 500, existingError.message);
    // A resubmit must not be able to undo an existing verification.
    if (existing?.status === "verified") throw new AppError("KYC_ALREADY_VERIFIED", 409);

    const result = await checkKyc({
      businessName: input.businessName,
      gstNumber: input.gstNumber,
      pan: input.pan,
    });

    const { error: upsertError } = await db.from("buyer_kyc").upsert(
      {
        buyer_id: user.id,
        business_name: input.businessName,
        gst_number: input.gstNumber,
        pan_last4: input.pan.slice(-4),
        status: result.status,
        source: result.source,
      },
      { onConflict: "buyer_id" },
    );
    if (upsertError) throw new AppError("INTERNAL", 500, upsertError.message);

    return json({ ok: true, data: result });
  }),
);
