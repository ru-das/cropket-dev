// Layout every farmer/buyer/fpo screen sits inside (SPEC.md §3, §4.4).
// Mobile: header + bottom dock, single column. md+: left sidebar rail + wider
// content column. lg+: rail expands to show labels. Works down to 320 px.
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import NetworkBanner from "./NetworkBanner";
import SyncTrouble from "./SyncTrouble";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";

export default function AppShell() {
  return (
    // Outer viewport wrapper — centres content on ultra-wide displays
    <div className="min-h-screen bg-field md:flex md:justify-center">
      {/* Two-column shell on md+; single column on mobile */}
      <div className="relative flex w-full flex-col bg-field md:max-w-5xl md:flex-row lg:max-w-6xl xl:max-w-7xl md:shadow-float md:border-x md:border-line">
        {/* ── Left sidebar (md+) ── */}
        <SideNav />

        {/* ── Right content column ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top header (visible on all widths; on md+ brand is in sidebar) */}
          <AppHeader />
          <NetworkBanner />
          <SyncTrouble />

          {/* Page content — extra horizontal padding and wider line-length on md+ */}
          <main className="flex-1 p-4 pb-28 md:p-6 md:pb-8 lg:p-8">
            {/* Max readable line-length container for form/text pages */}
            <div className="mx-auto w-full max-w-prose lg:max-w-none">
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
