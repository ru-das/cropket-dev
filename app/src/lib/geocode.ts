// Best-effort reverse geocoding for onboarding's "Use my location" (SPEC.md
// §4.3): turns a GPS fix into a village name to autofill the text field.
// Uses MapTiler's public geocoding API directly from the browser with the
// same VITE_MAPTILER_KEY the map tiles already use (MandiHeatmap.tsx) - no
// new secret, no Edge Function. Never throws: a missing key or a failed call
// just means no autofill, the farmer can still type the name by hand
// (CLAUDE.md §5 "advisory, never blocks").
import { z } from "zod";
import { config } from "@/lib/config";
import type { Coordinates } from "@/lib/native";

const GeocodeResponse = z.object({
  features: z.array(z.object({ text: z.string() })),
});

export async function reverseGeocodeVillage(coords: Coordinates): Promise<string | null> {
  if (!config.maptilerKey) return null;

  try {
    const url = `https://api.maptiler.com/geocoding/${coords.lng},${coords.lat}.json?key=${config.maptilerKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const body = GeocodeResponse.safeParse(await res.json());
    if (!body.success) return null;

    return body.data.features[0]?.text ?? null;
  } catch {
    return null;
  }
}
