// SmartFrameCamera (SPEC.md §5.1, §4.5): live camera with a guide frame that
// turns green/red from the average brightness (sampled from a small canvas
// every 300 ms), blocks capture while too dark, and compresses each shot to
// ≤ 300 KB. Works fully offline - getUserMedia and canvas are both local, no
// network call anywhere in this file.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap, ZapOff } from "lucide-react";
import { getCameraStream, setTorch } from "@/lib/native";
import { AppError } from "@/lib/errors";
import { averageBrightness, fitDimensions, encodeUnder } from "./frame";
import { cn } from "@/lib/utils";

const SAMPLE_MS = 300;
const SAMPLE_SIZE = 32; // small enough to read every 300 ms with no jank
const MAX_EDGE_PX = 1280; // plenty for OpenCV grading (1.4), no need for full sensor res
const MAX_BYTES = 300 * 1024;

type Props = {
  crop: "onion" | "tomato" | "potato";
  shots?: number;
  minBrightness?: number;
  onDone: (photos: Blob[]) => void;
};

export default function SmartFrameCamera({ crop, shots = 3, minBrightness = 70, onDone }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef<Blob[]>([]);

  const [error, setError] = useState<AppError | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [taken, setTaken] = useState(0);
  const [capturing, setCapturing] = useState(false);

  // Opens the camera once on mount, closes it on unmount (and on the way
  // out after the last shot, in capture() below).
  useEffect(() => {
    let cancelled = false;
    getCameraStream()
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const capabilities = stream.getVideoTracks()[0]?.getCapabilities?.();
        setTorchAvailable(!!capabilities && "torch" in capabilities);
      })
      .catch((err: unknown) => {
        setError(err instanceof AppError ? err : new AppError("CAMERA_UNAVAILABLE"));
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Brightness sampling: draw the current frame small, read its mean luma.
  useEffect(() => {
    if (error) return;
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return; // not enough data yet
      ctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      setBrightness(averageBrightness(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data));
    }, SAMPLE_MS);

    return () => clearInterval(interval);
  }, [error]);

  const isDark = brightness < minBrightness;

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    if (await setTorch(track, next)) setTorchOn(next);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || isDark || capturing || taken >= shots) return;
    setCapturing(true);
    try {
      const { width, height } = fitDimensions(video.videoWidth, video.videoHeight, MAX_EDGE_PX);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);

      const blob = await encodeUnder(
        MAX_BYTES,
        (quality) =>
          new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("ENCODE_FAILED"))),
              "image/jpeg",
              quality,
            );
          }),
      );

      photosRef.current = [...photosRef.current, blob];
      setTaken(photosRef.current.length);
      if (photosRef.current.length >= shots) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onDone(photosRef.current);
      }
    } finally {
      setCapturing(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4 text-body text-mirchi-text shadow-card">
        {t(error.messageKey)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative w-full overflow-hidden rounded-3xl bg-black shadow-hero border-2 border-line"
        aria-label={t("scan.title", { crop: t(`crop.${crop}`) })}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-3/4 w-full object-cover"
        />

        {/* Ambient lighting pill with smooth blur */}
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center z-10">
          <span
            className={cn(
              "rounded-full border-2 px-4.5 py-1.5 font-display text-meta font-bold shadow-float backdrop-blur-md transition-all duration-300",
              isDark
                ? "border-mirchi/80 bg-mirchi-light/95 text-mirchi-text shadow-glow-haldi"
                : "border-pass/80 bg-pass-light/95 text-pass-text shadow-glow-leaf",
            )}
          >
            {isDark ? `⚠ ${t("scan.tooDark")}` : `✅ ${t("scan.lightGood")}`}
          </span>
        </div>

        {/* Framing HUD guide */}
        <div
          className={cn(
            "pointer-events-none absolute inset-6 rounded-3xl border-2 transition-all duration-300",
            isDark
              ? "border-mirchi/80 shadow-[0_0_24px_rgba(185,28,28,0.35)]"
              : "border-pass/80 shadow-[0_0_24px_rgba(5,150,105,0.35)]",
          )}
        >
          {/* Target reticle for ₹10 coin */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="mb-3 flex h-17 w-17 items-center justify-center rounded-full border-2 border-dashed border-white/95 bg-black/40 font-display text-xl font-black text-white shadow-float ring-4 ring-white/25 backdrop-blur-xs">
              ₹10
            </div>
            <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-center font-display text-meta font-bold text-white shadow-float backdrop-blur-md">
              {t("scan.coinHint")}
            </span>
          </div>
        </div>
      </div>

      {/* Shot progress indicator */}
      <div className="flex items-center gap-3.5 rounded-full border-2 border-line bg-surface px-5 py-2.5 shadow-card">
        <span className="font-display text-meta font-bold text-ink">
          {t("scan.photoOf", { n: Math.min(taken + 1, shots), total: shots })}
        </span>
        <div className="ml-1 flex gap-2" aria-hidden="true">
          {Array.from({ length: shots }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full transition-all duration-300",
                i < taken
                  ? "bg-leaf scale-125 shadow-glow-leaf ring-2 ring-leaf/30"
                  : "bg-line",
              )}
            />
          ))}
        </div>
      </div>

      {/* Capture controls */}
      <div className="flex items-center justify-center gap-6 mt-1">
        <button
          type="button"
          onClick={() => void capture()}
          disabled={isDark || capturing}
          aria-label={t("scan.capture")}
          className="group relative flex h-22 w-22 items-center justify-center rounded-full border-4 border-surface bg-leaf shadow-hero transition-transform duration-200 active:scale-90 disabled:opacity-40 disabled:bg-line"
        >
          <div className="h-16 w-16 rounded-full border-2 border-white/90 bg-leaf-hover transition-transform duration-200 group-hover:scale-95 shadow-xs" />
        </button>

        {torchAvailable && (
          <button
            type="button"
            onClick={() => void toggleFlash()}
            aria-label={t("scan.flash")}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-line bg-surface text-leaf-dark shadow-card active:scale-90 transition-all duration-200 hover:border-leaf hover:bg-leaf-light/40"
          >
            {torchOn ? (
              <Zap aria-hidden="true" size={24} className="text-haldi fill-haldi" />
            ) : (
              <ZapOff aria-hidden="true" size={24} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
