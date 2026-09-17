// Pure helpers for SmartFrameCamera (SPEC.md §5.1) - no DOM, no camera, so
// they're testable in Vitest's plain "node" environment. SmartFrameCamera.tsx
// is the thin, untested half that wires these to a real <video>/<canvas>.

/**
 * Mean brightness (0-255) of an RGBA pixel buffer, using the standard luma
 * weights. Called on a small (32×32) offscreen canvas sampled from the video
 * every 300 ms - SmartFrameCamera compares the result to `minBrightness` to
 * decide the frame's green/red state.
 * ponytail: a flat whole-frame mean, not centre-weighted or histogram-based
 * - a bright sunlit background behind a dark onion could fool it. Upgrade to
 * a centre-weighted read if that shows up in field testing.
 */
export function averageBrightness(rgba: Uint8ClampedArray | number[]): number {
  if (rgba.length === 0) return 0;
  let sum = 0;
  let pixels = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
    pixels++;
  }
  return sum / pixels;
}

/** Scales w×h down so the longer edge is at most `max`, keeping aspect ratio. Never upscales. */
export function fitDimensions(
  w: number,
  h: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= max) return { width: w, height: h };
  const scale = max / longest;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

// ponytail: tries a fixed list of qualities rather than binary-searching for
// the tightest one under the cap - 3 steps is plenty for a photo capped at
// 300 KB, and a real search would cost more canvas.toBlob calls for no
// visible benefit at this size. Revisit if phones regularly need a 4th step.
const QUALITIES = [0.8, 0.6, 0.45];

/**
 * Tries each JPEG quality in turn (stopping at the first one that fits),
 * returns the first blob at or under `maxBytes`, or the smallest one tried
 * if none fit. `encode` is injected - the real caller wraps
 * `canvas.toBlob(cb, "image/jpeg", quality)` in a promise - so this has no
 * canvas dependency and is testable with a fake encoder.
 */
export async function encodeUnder(
  maxBytes: number,
  encode: (quality: number) => Promise<Blob>,
): Promise<Blob> {
  let smallest: Blob | null = null;
  for (const quality of QUALITIES) {
    const blob = await encode(quality);
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= maxBytes) return blob;
  }
  // QUALITIES is never empty, so a loop that never returned early always set smallest.
  return smallest as Blob;
}
