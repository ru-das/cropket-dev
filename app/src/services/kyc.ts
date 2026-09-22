// Buyer KYC: submit, read own status, admin queue + approve/reject
// (SPEC.md §5.4, §5.6, §9.2 Phase 3 "3.1"). The only file that talks to
// Supabase for `buyer_kyc` (CLAUDE.md §3 "data access from the app goes
// through services/*"). Online-only - SPEC.md §10.3 lists KYC alongside
// money and bidding, so this never goes through the outbox
// (offline/outbox.ts's OUTBOX_KINDS deliberately excludes it).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callFunction } from "@/lib/callFunction";
import { toAppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { KycRequest, type KycResult } from "@shared/schemas/kyc.ts";
import type { Database } from "@/lib/database.types";

export type BuyerKyc = Database["public"]["Tables"]["buyer_kyc"]["Row"];
// buyer_kyc.status is `text` + `check` (not a Postgres enum - see its
// migration), so the generated Row type is a plain `string`. A literal
// union here is what lets the admin screen's `t(\`kyc.status.${status}\`)`
// type-check, same pattern GradeBadge.tsx's `Grade` union enables.
export type KycStatus = "pending" | "verified" | "rejected";

export const kycKeys = {
  mine: () => ["kyc", "mine"] as const,
  queue: () => ["kyc", "queue"] as const,
};

async function getMyKyc(): Promise<BuyerKyc | null> {
  const { data, error } = await supabase.from("buyer_kyc").select("*").maybeSingle();
  if (error) throw toAppError(error);
  return data;
}

/** The signed-in buyer's own KYC row, or null before their first submission. */
export function useMyKyc() {
  return useQuery({ queryKey: kycKeys.mine(), queryFn: getMyKyc });
}

/**
 * Submits (or resubmits, after a rejection) the buyer's KYC details. Throws
 * `KYC_ALREADY_VERIFIED` if they are already verified - a resubmit can never
 * undo an existing verification. The caller (KycPage) calls `refreshProfile()`
 * afterwards so `profile.kyc_status` (flipped by the buyer_kyc_sync trigger)
 * updates everywhere at once, same pattern OnboardingPage uses after
 * `createMyProfile()`.
 */
export async function submitKyc(input: KycRequest): Promise<KycResult> {
  const parsed = KycRequest.parse(input);
  const result = await callFunction<KycResult>("kyc-verify", parsed);
  await queryClient.invalidateQueries({ queryKey: kycKeys.mine() });
  return result;
}

async function getPendingKyc(): Promise<BuyerKyc[]> {
  const { data, error } = await supabase
    .from("buyer_kyc")
    .select("*")
    .order("status", { ascending: true }) // 'pending' sorts before 'rejected'/'verified'
    .order("created_at", { ascending: true });
  if (error) throw toAppError(error);
  return data;
}

/** Every buyer_kyc row, pending first - the admin approve queue (RLS: admin only). */
export function usePendingKyc() {
  return useQuery({ queryKey: kycKeys.queue(), queryFn: getPendingKyc });
}

/** Admin approve/reject. Allowed by buyer_kyc's column grant + admin RLS policy. */
export async function setKycStatus(buyerId: string, status: "verified" | "rejected"): Promise<void> {
  const { error } = await supabase.from("buyer_kyc").update({ status }).eq("buyer_id", buyerId);
  if (error) throw toAppError(error);
  await queryClient.invalidateQueries({ queryKey: kycKeys.queue() });
}
