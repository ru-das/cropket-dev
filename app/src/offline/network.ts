// Tells the app whether the phone has internet right now (SPEC.md §5.8,
// §4.22 "Offline" banner). Browser events only for now — Capacitor's native
// Network plugin is added in milestone 5.4 when Capacitor exists in the repo.
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/** True when the browser reports internet access. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
