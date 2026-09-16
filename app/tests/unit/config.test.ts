// Checks readConfig() - the pure function config.ts builds on top of
// import.meta.env. CLAUDE.md §6: missing optional keys must not crash,
// missing Supabase values must give "Setup needed" (a non-empty setupErrors).
import { describe, expect, it } from "vitest";
import { readConfig } from "@/lib/config";

const fullEnv = {
  VITE_SUPABASE_URL: "https://cropket-dev.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb-publishable-key",
  VITE_APP_URL: "https://cropket.vercel.app",
  VITE_MAPTILER_KEY: "maptiler-key",
  VITE_DEFAULT_LANG: "hi",
  VITE_DEMO_MODE: "true",
};

describe("readConfig", () => {
  it("reads a full valid env", () => {
    const config = readConfig(fullEnv);
    expect(config.setupErrors).toEqual([]);
    expect(config.supabaseUrl).toBe(fullEnv.VITE_SUPABASE_URL);
    expect(config.supabasePublishableKey).toBe(fullEnv.VITE_SUPABASE_PUBLISHABLE_KEY);
    expect(config.appUrl).toBe(fullEnv.VITE_APP_URL);
    expect(config.maptilerKey).toBe(fullEnv.VITE_MAPTILER_KEY);
    expect(config.defaultLang).toBe("hi");
    expect(config.demoMode).toBe(true);
  });

  it("does not crash when optional keys are missing or blank, and defaults demoMode to false", () => {
    const config = readConfig({
      VITE_SUPABASE_URL: fullEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: fullEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_MAPTILER_KEY: "", // present in .env but left empty
      // VITE_APP_URL absent entirely, VITE_DEMO_MODE absent entirely
    });
    expect(config.setupErrors).toEqual([]);
    expect(config.maptilerKey).toBeUndefined();
    expect(config.appUrl).toBeUndefined();
    expect(config.demoMode).toBe(false);
  });

  it("reports missing or blank Supabase values instead of crashing", () => {
    const config = readConfig({
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
    });
    expect(config.setupErrors).toContain("VITE_SUPABASE_URL");
    expect(config.setupErrors).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("defaults VITE_DEFAULT_LANG to mr, and reports a junk value instead of crashing", () => {
    const missing = readConfig({
      VITE_SUPABASE_URL: fullEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: fullEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(missing.defaultLang).toBe("mr");
    expect(missing.setupErrors).toEqual([]);

    const junk = readConfig({
      VITE_SUPABASE_URL: fullEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: fullEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_DEFAULT_LANG: "xx",
    });
    expect(junk.setupErrors).toContain("VITE_DEFAULT_LANG");
  });
});
