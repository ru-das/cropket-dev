// consentAudioPath (SPEC.md §4.13, §5.1) - the only part of services/deals.ts
// that's pure. Its shape is exactly what the consent-audio bucket's RLS
// policies check, and what accept_bid's own CONSENT_REQUIRED check enforces
// server-side: the first path segment must be the caller's own uid.
import { describe, expect, it } from "vitest";
import { consentAudioPath } from "@/services/deals";

describe("consentAudioPath", () => {
  it("puts the file under the user's own uid folder", () => {
    expect(consentAudioPath("user-123", "bid-abc")).toBe("user-123/bid-abc.webm");
  });

  it("keeps the uid as the first path segment for any bid id", () => {
    const path = consentAudioPath("22222222-2222-2222-2222-222222222222", "b1");
    expect(path.split("/")[0]).toBe("22222222-2222-2222-2222-222222222222");
  });
});
