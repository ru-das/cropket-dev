// SPEC.md §5.8: the service worker must not register inside the Capacitor
// APK (it already ships every file). isNativeApp() is the one check main.tsx
// uses to skip that — this is the only branch worth testing here, the rest
// of 0.8 is build config (vite.config.ts, index.html, public/icons).
// getCurrentLocation (1.1) is onboarding's GPS step - SPEC.md §4.3.
import { afterEach, describe, expect, it, vi } from "vitest";
import { isNativeApp, getCurrentLocation } from "@/lib/native";
import { AppError } from "@/lib/errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isNativeApp", () => {
  it("is true when Capacitor is present on window", () => {
    vi.stubGlobal("window", { Capacitor: {} });
    expect(isNativeApp()).toBe(true);
  });

  it("is false in a plain browser window", () => {
    vi.stubGlobal("window", {});
    expect(isNativeApp()).toBe(false);
  });
});

describe("getCurrentLocation", () => {
  it("resolves with lat/lng on success", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            coords: { latitude: 20.0, longitude: 73.79 },
          } as GeolocationPosition);
        },
      },
    });

    await expect(getCurrentLocation()).resolves.toEqual({ lat: 20.0, lng: 73.79 });
  });

  it("rejects with LOCATION_DENIED when permission is denied (code 1)", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
          error({ code: 1 } as GeolocationPositionError);
        },
      },
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: "LOCATION_DENIED" });
  });

  it("rejects with LOCATION_UNAVAILABLE on timeout (code 3)", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
          error({ code: 3 } as GeolocationPositionError);
        },
      },
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: "LOCATION_UNAVAILABLE" });
  });

  it("rejects with LOCATION_UNAVAILABLE when the browser has no geolocation API", async () => {
    vi.stubGlobal("navigator", {});

    await expect(getCurrentLocation()).rejects.toBeInstanceOf(AppError);
    await expect(getCurrentLocation()).rejects.toMatchObject({ code: "LOCATION_UNAVAILABLE" });
  });
});
