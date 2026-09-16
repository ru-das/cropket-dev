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
import path from "node:path";

const root = import.meta.dirname;
const sharedDomainDir = path.resolve(root, "../supabase/functions/_shared/domain");

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
