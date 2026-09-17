// Wrappers for native-ish browser APIs (CLAUDE.md §3 "native features go
// through native.ts" - camera, GPS, network, storage, push all land here as
// each milestone needs them). Today: isNativeApp (0.8) and getCurrentLocation
// (1.1). Milestone 5.4 swaps getCurrentLocation's body for Capacitor's
// Geolocation plugin without changing its signature, so callers never notice.
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
