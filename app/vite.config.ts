// Vite build config. Read by `pnpm dev`, `pnpm build`, `pnpm preview` and Vitest.
// @shared points at the pure domain code in supabase/functions/_shared/domain
// (money, split, advice ...) so the app and the Edge Functions share one copy.
// Those files import "zod" like any Deno module would; since they live
// outside app/, Node's resolver can't find app/node_modules/zod for them by
// walking up from their own folder, so it's aliased here explicitly
// (CLAUDE.md §4 "same zod version in app and functions").
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const root = import.meta.dirname;
const sharedDomainDir = path.resolve(root, "../supabase/functions/_shared/domain");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable web app + offline app shell (SPEC.md §5.8, §9.2 Phase 0).
    // Not registered inside the Capacitor APK — see lib/native.ts + main.tsx.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // we call registerSW() ourselves, web-only (main.tsx)
      manifest: {
        name: "Cropket",
        short_name: "Cropket",
        description: "Fair mandi prices and safe payments for farmers.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#1F6B3A", // --leaf
        background_color: "#F3F6F0", // --field
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Default globPatterns misses woff2 (Devanagari fonts) and mp3 (bundled
        // voice clips land in 1.5). .woff is skipped on purpose: every browser
        // that can run a service worker also reads woff2, so caching both would
        // just double ~600 KB of fonts for nothing.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,mp3}"],
        // So routes like /farmer/khata also open offline, not just "/".
        navigateFallback: "index.html",
        // No runtimeCaching here: TanStack Query already persists server reads
        // to IndexedDB (offline/persist.ts). A second SW-level cache of the same
        // Supabase responses could show stale data with no <DataAge> label next
        // to it — the "never quietly switch to mock/stale" rule in CLAUDE.md §5.
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
      "@shared": sharedDomainDir,
      zod: path.resolve(root, "./node_modules/zod"),
    },
  },
  server: {
    fs: {
      // allow importing _shared/domain files from outside app/, since they
      // live one level up in supabase/functions/_shared/domain
      allow: [path.resolve(root, ".."), sharedDomainDir],
    },
  },
  worker: {
    // MandiHeatmap.tsx loads maplibre-gl's tile worker with `{ type: "module" }` and
    // the worker file itself uses `import()`, so it must be built as ESM. Vite's
    // default ("iife") can't bundle those dynamic imports and doesn't match how the
    // worker is loaded.
    format: "es",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      // split.ts lives outside app/ (in _shared/domain, imported via the
      // @shared alias) - v8's default coverage scan only looks inside the
      // project root, so it needs allowExternal + an explicit include to
      // be measured at all.
      allowExternal: true,
      include: [`${sharedDomainDir}/split.ts`],
      // Only split.ts has a coverage floor today (CLAUDE.md §6 "100%
      // branch coverage" - a money-splitting formula, not the whole repo).
      // Add another file's path here if a future test plan asks for the
      // same guarantee.
      thresholds: {
        "../supabase/functions/_shared/domain/split.ts": { branches: 100 },
      },
    },
  },
});
