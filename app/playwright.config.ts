// Playwright config for the one P0 happy-path e2e test (SPEC.md §9.2 Phase 9,
// AGENTS.md §6 "5.2"). Runs the real dev server against the real cropket-dev
// cloud project - no mock server, same as the SQL tests run against real
// cropket-dev (CLAUDE.md "Simple setup"). globalSetup makes the two test
// accounts ready before every run (tests/e2e/global-setup.ts).
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-IN",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["camera", "microphone", "geolocation"],
        // Niphad, Nashik (SPEC.md §8.6 pilot town) - same point seed.sql's
        // own Niphad mandi row uses, so NewLotPage's GPS read lands on real
        // seeded ground instead of null island.
        geolocation: { latitude: 20.0847, longitude: 74.1116 },
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
          ],
        },
      },
    },
  ],
});
