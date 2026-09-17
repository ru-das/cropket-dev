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
      <div className="rounded-card border border-line bg-surface p-4 text-body text-mirchi-text">
        {t(error.messageKey)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full overflow-hidden rounded-card bg-ink"
        aria-label={t("scan.title", { crop: t(`crop.${crop}`) })}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-3/4 w-full object-cover"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-6 rounded-card border-4",
            isDark ? "border-mirchi" : "border-pass",
          )}
        >
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-meta font-semibold text-surface drop-shadow">
            {t("scan.coinHint")}
          </span>
        </div>
      </div>

      <p className="text-body font-semibold text-ink">
        {t("scan.photoOf", { n: Math.min(taken + 1, shots), total: shots })}
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: shots }, (_, i) => (
          <span
            key={i}
            className={cn("h-2.5 w-2.5 rounded-full", i < taken ? "bg-leaf" : "border border-line")}
          />
        ))}
      </div>
      <p className={cn("text-body", isDark ? "text-mirchi-text" : "text-pass-text")}>
        {isDark ? t("scan.tooDark") : t("scan.lightGood")}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => void capture()}
          disabled={isDark || capturing}
          aria-label={t("scan.capture")}
          className="h-16 w-16 rounded-full border-4 border-line bg-surface disabled:opacity-40"
        />
        {torchAvailable && (
          <button
            type="button"
            onClick={() => void toggleFlash()}
            aria-label={t("scan.flash")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-leaf-dark"
          >
            {torchOn ? (
              <Zap aria-hidden="true" size={20} />
            ) : (
              <ZapOff aria-hidden="true" size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
