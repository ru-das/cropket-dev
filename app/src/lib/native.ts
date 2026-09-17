// Wrappers for native-ish browser APIs (CLAUDE.md §3 "native features go
// through native.ts" - camera, GPS, network, storage, push all land here as
// each milestone needs them). Today: isNativeApp (0.8), getCurrentLocation
// (1.1), getCameraStream + setTorch (1.2). Milestone 5.4 swaps these bodies
// for Capacitor's Geolocation/Camera plugins without changing their
// signatures, so callers never notice.
import { AppError } from "@/lib/errors";

// Tells the app whether it is running inside the Capacitor APK or in a
// browser/PWA. Used by main.tsx to skip service-worker registration inside
// the native app (SPEC.md §5.8 "the service worker is not registered in the
// APK" — the APK already ships every file inside it).
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && "Capacitor" in window;
}

export type Coordinates = { lat: number; lng: number };

// Onboarding's "Use my location" step (SPEC.md §4.3). Browser geolocation
// needs HTTPS or localhost - on a real phone over USB, `adb reverse
// tcp:5173 tcp:5173` and open http://localhost:5173, not the LAN IP.
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new AppError("LOCATION_UNAVAILABLE"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        // code 1 = PERMISSION_DENIED. Codes 2 (POSITION_UNAVAILABLE) and 3
        // (TIMEOUT) both just mean "couldn't get a fix right now" - the app
        // treats them the same way (offer Skip), so they share one code.
        reject(new AppError(error.code === 1 ? "LOCATION_DENIED" : "LOCATION_UNAVAILABLE"));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// SmartFrameCamera (SPEC.md §5.1, §4.5). The back camera at a size that's
// plenty for OpenCV grading (1.4) without asking the phone for 4K.
export async function getCameraStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new AppError("CAMERA_UNAVAILABLE");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 } },
      audio: false,
    });
  } catch (err) {
    const denied = err instanceof Error && err.name === "NotAllowedError";
    throw new AppError(denied ? "CAMERA_DENIED" : "CAMERA_UNAVAILABLE");
  }
}

// Toggles the flash/torch on the given camera track. Returns whether it
// actually turned on - some phones (and most laptops) have no torch, and
// SmartFrameCamera hides the ⚡ Flash button when this is false.
export async function setTorch(track: MediaStreamTrack, on: boolean): Promise<boolean> {
  const capabilities = track.getCapabilities?.();
  if (!capabilities || !("torch" in capabilities)) return false;
  try {
    // @ts-expect-error - `torch` is a real, widely-supported constraint that TypeScript's DOM lib doesn't type yet.
    await track.applyConstraints({ advanced: [{ torch: on }] });
    return true;
  } catch {
    return false;
  }
}
