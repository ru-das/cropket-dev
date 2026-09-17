// reverseGeocodeVillage() (onboarding's GPS-to-village autofill, 1.1) must
// never throw - a missing key, a failed call or a bad response all just mean
// "no autofill", not a crash (CLAUDE.md §5 "advisory, never blocks").
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({ config: { maptilerKey: "test-key" } }));

import { reverseGeocodeVillage } from "@/lib/geocode";

const coords = { lat: 20.0, lng: 73.79 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reverseGeocodeVillage", () => {
  it("returns the first feature's name on a good response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [{ text: "Niphad" }, { text: "Nashik" }] }),
      }),
    );
    expect(await reverseGeocodeVillage(coords)).toBe("Niphad");
  });

  it("returns null when the response has no features", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) }),
    );
    expect(await reverseGeocodeVillage(coords)).toBeNull();
  });

  it("returns null on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await reverseGeocodeVillage(coords)).toBeNull();
  });

  it("returns null instead of throwing when the network call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await reverseGeocodeVillage(coords)).toBeNull();
  });

  it("returns null instead of throwing on a malformed response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ not: "expected" }) }),
    );
    expect(await reverseGeocodeVillage(coords)).toBeNull();
  });
});

describe("reverseGeocodeVillage without a MapTiler key", () => {
  it("returns null without calling fetch", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({ config: { maptilerKey: undefined } }));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { reverseGeocodeVillage: reverseGeocodeVillageNoKey } = await import("@/lib/geocode");
    expect(await reverseGeocodeVillageNoKey(coords)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.doUnmock("@/lib/config");
  });
});
