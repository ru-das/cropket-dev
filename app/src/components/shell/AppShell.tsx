// Layout every farmer/buyer/fpo screen sits inside (SPEC.md §3, §4.4):
// header, offline banner, the page itself, bottom nav. Works down to 320 px.
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import NetworkBanner from "./NetworkBanner";
import SyncTrouble from "./SyncTrouble";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-field shadow-sm sm:border-x sm:border-line">
      <AppHeader />
      <NetworkBanner />
      <SyncTrouble />
      <main className="flex-1 p-4 pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
