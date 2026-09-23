// Calls the `trip` Edge Function - the driver's own page, `/t/:token`, has
// no login (SPEC.md §4.16, §5.4, §9.2 Phase 4 "4.7"). The token in the URL
// is the only credential (CLAUDE.md §3 "the driver never talks to
// Supabase directly") - every call here works exactly the same signed out,
// unlike every other service in this folder.
import { useMutation, useQuery } from "@tanstack/react-query";
import { callFunction } from "@/lib/callFunction";
import type { AppError } from "@/lib/errors";
import { queryClient } from "@/offline/persist";
import { TripStateResult, PodInput, PodResult, OtpSubmitInput, OtpSubmitResult } from "@shared/schemas/shipment.ts";

export const tripKeys = {
  state: (token: string) => ["trip", token] as const,
};

async function getTripState(token: string): Promise<TripStateResult> {
  const result = await callFunction<TripStateResult>(`trip/${token}`, undefined, "GET");
  return TripStateResult.parse(result);
}

/** TripPage's own state - which step is active (IN_TRANSIT -> photo,
 * DELIVERED -> code), the vehicle number and crop/kg to show. `retry:
 * false` - a bad or expired link never becomes valid by retrying. */
export function useTrip(token: string) {
  return useQuery({
    queryKey: tripKeys.state(token),
    queryFn: () => getTripState(token),
    retry: false,
  });
}

type PodUpload = { photo: Blob; lat?: number; lng?: number; takenAt: string };

async function uploadPod(token: string, input: PodUpload): Promise<PodResult> {
  // Only the non-file fields go through the shared schema - `photo` isn't
  // part of it (a File/Blob isn't JSON), it goes straight into the
  // FormData the trip function itself parses.
  const { lat, lng, takenAt } = PodInput.parse({ lat: input.lat, lng: input.lng, takenAt: input.takenAt });
  const form = new FormData();
  form.set("photo", input.photo, "delivery.jpg");
  if (lat !== undefined) form.set("lat", String(lat));
  if (lng !== undefined) form.set("lng", String(lng));
  form.set("takenAt", takenAt);
  const result = await callFunction<PodResult>(`trip/${token}/pod`, form);
  return PodResult.parse(result);
}

/** Step 1's "Photo of unloaded goods" - SmartFrameCamera hands back a
 * single Blob (shots={1}), same shape services/photos.ts takes for the
 * farmer's own camera. On success the trip state is refetched, which is
 * what moves the driver page on to step 2 (the state came back DELIVERED). */
export function useUploadPod(token: string) {
  return useMutation<PodResult, AppError, PodUpload>({
    mutationFn: (input) => uploadPod(token, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.state(token) });
    },
  });
}

async function submitOtp(token: string, input: OtpSubmitInput): Promise<OtpSubmitResult> {
  const parsed = OtpSubmitInput.parse(input);
  const result = await callFunction<OtpSubmitResult>(`trip/${token}/otp`, parsed);
  return OtpSubmitResult.parse(result);
}

/** Step 2's code entry. A correct guess doesn't move the escrow past
 * DELIVERED yet - that's 4.8 (escrow-release) - so the page reads
 * `correct`/`triesLeft` straight from this call's own result, not from a
 * state refetch. */
export function useSubmitOtp(token: string) {
  return useMutation<OtpSubmitResult, AppError, OtpSubmitInput>({
    mutationFn: (input) => submitOtp(token, input),
  });
}
