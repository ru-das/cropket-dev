// Layout every farmer/buyer/fpo screen sits inside (SPEC.md §3, §4.4).
// Mobile: header + bottom dock, single column. md+: left sidebar rail + wider
// content column. lg+: rail expands to show labels. Works down to 320 px.
import { Outlet, useLocation } from "react-router";
import AppHeader from "./AppHeader";
import NetworkBanner from "./NetworkBanner";
import SyncTrouble from "./SyncTrouble";
import SyncBar from "./SyncBar";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const location = useLocation();
  const isScan = location.pathname === "/farmer/scan";

  return (
    // Outer viewport wrapper — centres content on ultra-wide displays
    <div
      className={cn(
        "bg-field md:flex md:justify-center",
        isScan ? "h-dvh max-h-dvh overflow-hidden" : "min-h-screen",
      )}
    >
      {/* Upload progress hairline — fixed top-0, zero layout cost */}
      <SyncBar />
      {/* Two-column shell on md+; single column on mobile */}
      <div
        className={cn(
          "relative flex w-full flex-col bg-field md:max-w-5xl md:flex-row lg:max-w-6xl xl:max-w-7xl md:shadow-float md:border-x md:border-line",
          isScan && "h-full max-h-dvh overflow-hidden",
        )}
      >
        {/* ── Left sidebar (md+) ── */}
        <SideNav />

        {/* ── Right content column ── */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            isScan && "h-full overflow-hidden",
          )}
        >
          {/* Top header (visible on all widths; on md+ brand is in sidebar) */}
          <AppHeader />
          <NetworkBanner />
          <SyncTrouble />

          {/* Page content — extra horizontal padding and wider line-length on md+; full-bleed viewport on scan */}
          <main
            className={cn(
              "flex-1",
              isScan
                ? "relative p-0 pb-[4.25rem] md:pb-0 overflow-hidden flex flex-col min-h-0"
                : "p-4 pb-28 md:p-6 md:pb-8 lg:p-8",
            )}
          >
            {/* Max readable line-length container for form/text pages; full height on scan */}
            <div
              className={cn(
                "w-full",
                isScan ? "h-full flex-1 flex flex-col min-h-0" : "mx-auto max-w-prose lg:max-w-none",
              )}
            >
              <Outlet />
            </div>
          </main>

          {/* Bottom dock (mobile only; md+ uses sidebar) */}
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
