// Pure half of SmartFrameCamera (SPEC.md §5.1): brightness read, resize math,
// and the size-cap encoder. No canvas/DOM - all three take plain data or an
// injected encoder, per components/camera/frame.ts's own doc comment.
import { describe, expect, it } from "vitest";
import { averageBrightness, fitDimensions, encodeUnder } from "@/components/camera/frame";

function fakeBlob(size: number): Blob {
  return { size } as Blob;
}

describe("averageBrightness", () => {
  it("is 0 for an all-black frame", () => {
    const pixels = new Uint8ClampedArray(4 * 4).fill(0);
    expect(averageBrightness(pixels)).toBe(0);
  });

  it("is 255 for an all-white frame", () => {
    const pixels = new Uint8ClampedArray(4 * 4).fill(255);
    expect(averageBrightness(pixels)).toBe(255);
  });

  it("is roughly mid-grey for a mid-grey frame", () => {
    const pixels = new Uint8ClampedArray(4 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }
    expect(averageBrightness(pixels)).toBeCloseTo(128, 0);
  });

  it("is 0 for an empty buffer", () => {
    expect(averageBrightness(new Uint8ClampedArray(0))).toBe(0);
  });
});

describe("fitDimensions", () => {
  it("keeps aspect ratio when scaling a wide image down", () => {
    expect(fitDimensions(4000, 2000, 1280)).toEqual({ width: 1280, height: 640 });
  });

  it("keeps aspect ratio when scaling a tall image down", () => {
    expect(fitDimensions(2000, 4000, 1280)).toEqual({ width: 640, height: 1280 });
  });

  it("never upscales an image already under the cap", () => {
    expect(fitDimensions(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });
});

describe("encodeUnder", () => {
  it("returns the first quality that fits under the cap", async () => {
    const sizesByQuality: Record<number, number> = { 0.8: 500_000, 0.6: 200_000, 0.45: 100_000 };
    const tried: number[] = [];
    const blob = await encodeUnder(300_000, (quality) => {
      tried.push(quality);
      return Promise.resolve(fakeBlob(sizesByQuality[quality]));
    });
    expect(blob.size).toBe(200_000);
    expect(tried).toEqual([0.8, 0.6]); // stops as soon as one fits, never tries 0.45
  });

  it("falls back to the smallest blob tried when nothing fits", async () => {
    const blob = await encodeUnder(50_000, (quality) =>
      Promise.resolve(fakeBlob(quality === 0.8 ? 500_000 : quality === 0.6 ? 300_000 : 200_000)),
    );
    expect(blob.size).toBe(200_000);
  });

  it("accepts the first quality when it is already the smallest possible", async () => {
    const blob = await encodeUnder(300_000, () => Promise.resolve(fakeBlob(1_000)));
    expect(blob.size).toBe(1_000);
  });
});
