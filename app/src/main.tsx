// App entry point. Mounts the React tree into #root (see index.html).
// Fonts are bundled here (no CDN, SPEC.md §6.3): Mukta at the three weights
// the design system uses, Baloo 2 as one variable file covering 600 + 700.
// Both packages ship latin(-ext) + devanagari + (Baloo 2 only) vietnamese -
// Fontsource does not publish a latin+devanagari-only build, and hand
// splitting the files would add real complexity to save a few KB.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/500.css";
import "@fontsource/mukta/600.css";
import "@fontsource-variable/baloo-2";
import "./styles/globals.css";
import "./lib/i18n";
import { config } from "./lib/config";
import { isNativeApp } from "./lib/native";
import SetupNeeded from "./app/SetupNeeded.tsx";
import ErrorBoundary from "./app/ErrorBoundary.tsx";
import AppRouter from "./app/router.tsx";
import { Providers } from "./app/providers.tsx";

// Web only, not inside the Capacitor APK (SPEC.md §5.8) — the service worker
// caches the app shell/fonts so the web app installs and opens offline.
if (!isNativeApp()) {
  registerSW({ immediate: true });
  void navigator.storage?.persist(); // SPEC.md §5.8 rule 5 — ask Android not to clear our data
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {config.setupErrors.length > 0 ? (
      <SetupNeeded missing={config.setupErrors} />
    ) : (
      <ErrorBoundary>
        <Providers>
          <AppRouter />
        </Providers>
      </ErrorBoundary>
    )}
  </StrictMode>,
);
