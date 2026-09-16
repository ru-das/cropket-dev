// Vite build config. Read by `pnpm dev`, `pnpm build`, `pnpm preview` and Vitest.
// @shared points at the pure domain code in supabase/functions/_shared/domain
// (money, split, advice ...) so the app and the Edge Functions share one copy.
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
