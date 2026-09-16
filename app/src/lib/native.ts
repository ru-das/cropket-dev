// Tells the app whether it is running inside the Capacitor APK or in a
// browser/PWA. Used by main.tsx to skip service-worker registration inside
// the native app (SPEC.md §5.8 "the service worker is not registered in the
// APK" — the APK already ships every file inside it). Capacitor itself is
// added in milestone 5.4; this check is written now so 0.8 can honour that
// rule from day one instead of retrofitting it later.
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && "Capacitor" in window;
}
