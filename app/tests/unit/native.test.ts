// SPEC.md §5.8: the service worker must not register inside the Capacitor
// APK (it already ships every file). isNativeApp() is the one check main.tsx
// uses to skip that — this is the only branch worth testing here, the rest
// of 0.8 is build config (vite.config.ts, index.html, public/icons).
import { afterEach, describe, expect, it, vi } from "vitest";
import { isNativeApp } from "@/lib/native";

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
