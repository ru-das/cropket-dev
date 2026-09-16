// App entry point. Mounts the React tree into #root (see index.html).
// Fonts are bundled here (no CDN, SPEC.md §6.3): Mukta at the three weights
// the design system uses, Baloo 2 as one variable file covering 600 + 700.
// Both packages ship latin(-ext) + devanagari + (Baloo 2 only) vietnamese -
// Fontsource does not publish a latin+devanagari-only build, and hand
// splitting the files would add real complexity to save a few KB.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/500.css";
import "@fontsource/mukta/600.css";
import "@fontsource-variable/baloo-2";
import "./styles/globals.css";
import { config } from "./lib/config";
import SetupNeeded from "./app/SetupNeeded.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {config.setupErrors.length > 0 ? <SetupNeeded missing={config.setupErrors} /> : <App />}
  </StrictMode>,
);
