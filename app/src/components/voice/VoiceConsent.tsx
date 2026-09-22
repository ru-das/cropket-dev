// Hold-to-record deal consent (SPEC.md §4.13, §5.1 "VoiceConsent ...
// hold-to-record (max 10 s), uploads to the consent-audio bucket, returns
// the storage path", §9.2 Phase 3 "3.6"). Recording itself is pure browser
// API (MediaRecorder, no package) - this component only hands the finished
// blob to onRecorded(); ConsentPage decides what to do with it (upload,
// then accept_bid).
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, RotateCcw } from "lucide-react";
import { getMicStream } from "@/lib/native";
import { AppError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const MAX_MS = 10_000;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

type Props = {
  /** The phrase shown and read aloud for the farmer to repeat, e.g.
   *  "Haan, main sehmat hoon" (SPEC.md §4.13). */
  phrase: string;
  onRecorded: (blob: Blob) => void;
};

export default function VoiceConsent({ phrase, onRecorded }: Props) {
  const { t } = useTranslation();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState<AppError | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string } | null>(null);

  // Stops the mic and clears timers on unmount, so a farmer navigating away
  // mid-hold never leaves the microphone open.
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (clip) URL.revokeObjectURL(clip.url);
    };
  }, [clip]);

  async function startRecording() {
    if (recording) return;
    setError(null);
    try {
      const stream = await getMicStream();
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setClip({ blob, url: URL.createObjectURL(blob) });
        onRecorded(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      stopTimerRef.current = setTimeout(stopRecording, MAX_MS);
    } catch (err) {
      setError(err instanceof AppError ? err : new AppError("MIC_UNAVAILABLE"));
    }
  }

  function stopRecording() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    stopTimerRef.current = null;
    tickRef.current = null;
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
  }

  function recordAgain() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 text-center font-body text-base font-semibold text-mirchi-text">
        {t(error.messageKey)}
      </div>
    );
  }

  if (clip) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-pass/40 bg-pass-light/40 p-5 shadow-card">
        <p className="font-display text-base font-bold text-pass-text">{t("consent.recorded")}</p>
        <audio controls src={clip.url} className="w-full" />
        <button
          type="button"
          onClick={recordAgain}
          className="flex h-12 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-5 font-display text-sm font-bold text-ink transition-all hover:border-leaf active:scale-95"
        >
          <RotateCcw aria-hidden="true" size={18} />
          {t("consent.recordAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
      <p className="text-center font-body text-base font-semibold text-ink-muted">
        {t("consent.holdPrompt")}
      </p>
      <p className="text-center font-display text-lg font-bold text-ink">{`"${phrase}"`}</p>
      <button
        type="button"
        onPointerDown={() => void startRecording()}
        onPointerUp={stopRecording}
        onPointerCancel={stopRecording}
        onPointerLeave={() => recording && stopRecording()}
        aria-label={t("consent.holdPrompt")}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-hero transition-all duration-200 active:scale-95",
          recording ? "bg-mirchi shadow-glow-haldi" : "bg-leaf",
        )}
      >
        <Mic aria-hidden="true" size={32} className="text-white" />
      </button>
      {recording && (
        <p className="font-display text-base font-bold tabular-nums text-mirchi-text" aria-live="polite">
          {`● 0:${seconds.toString().padStart(2, "0")}`}
        </p>
      )}
    </div>
  );
}
