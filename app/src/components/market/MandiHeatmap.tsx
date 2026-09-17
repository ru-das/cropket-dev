// Coloured mandi map (SPEC.md §4.8 MandiHeatmap) - MapLibre GL + MapTiler
// tiles (CLAUDE.md stack row). Only imported through React.lazy from
// PricesPage, so maplibre-gl's ~250 KB never lands in the first-screen
// bundle (CLAUDE.md §4 "first screen JS < 200 KB"). The caller only renders
// this when `config.maptilerKey` is set - see PricesPage for the fallback
// to MandiList (CLAUDE.md §5 "VITE_MAPTILER_KEY missing -> show MandiList").
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
// maplibre-gl 6.x has no default export - `Map` is named `MapLibreMap` here
// because the plain name would shadow the built-in JS Map class.
import { Map as MapLibreMap, Marker, LngLatBounds, setWorkerUrl } from "maplibre-gl";
// maplibre-gl finds its tile-parsing web worker by guessing a path next to its own
// module URL, which is only right when it's served straight from node_modules. Any
// bundler moves it (Vite's dev cache, the production /assets folder, the APK), the
// guess 404s, and the worker never starts - the map then draws pins on an empty
// background with no visible error. So we import the worker through Vite (which emits
// it as a real file and gives us its URL) and tell maplibre to use that instead.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { config } from "@/lib/config";
import type { MandiPrice } from "@/services/prices";
import type { HeatColour } from "@shared/heat.ts";
import type { LatLng } from "@shared/geo.ts";

setWorkerUrl(maplibreWorkerUrl);

const HEAT_EMOJI: Record<HeatColour, string> = { red: "🔴", yellow: "🟡", green: "🟢" };
const NO_DATA_EMOJI = "⚪";
const YOU_EMOJI = "📍";

type Props = {
  mandiPrices: MandiPrice[];
  farmerLocation: LatLng | null;
};

export default function MandiHeatmap({ mandiPrices, farmerLocation }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerKey}`,
      center: [74.2, 20.1], // Nashik district, overwritten by fitBounds below once markers exist
      zoom: 9,
    });

    const markers: Marker[] = [];
    const bounds = new LngLatBounds();

    function addEmojiMarker(lngLat: [number, number], emoji: string, label: string) {
      const el = document.createElement("div");
      el.textContent = emoji;
      el.style.fontSize = "22px";
      el.title = label;
      markers.push(new Marker({ element: el }).setLngLat(lngLat).addTo(map));
      bounds.extend(lngLat);
    }

    for (const m of mandiPrices) {
      if (m.mandi.lat === null || m.mandi.lng === null) continue;
      addEmojiMarker(
        [m.mandi.lng, m.mandi.lat],
        m.heat ? HEAT_EMOJI[m.heat.colour] : NO_DATA_EMOJI,
        m.mandi.name,
      );
    }
    if (farmerLocation) {
      addEmojiMarker([farmerLocation.lng, farmerLocation.lat], YOU_EMOJI, t("prices.you"));
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, maxZoom: 12 });

    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [mandiPrices, farmerLocation, t]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-card border border-line"
      role="img"
      aria-label={t("prices.mapLabel")}
    />
  );
}
