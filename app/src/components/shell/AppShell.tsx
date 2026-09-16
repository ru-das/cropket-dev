// Layout every farmer/buyer/fpo screen sits inside (SPEC.md §3, §4.4):
// header, offline banner, the page itself, bottom nav. Works down to 320 px.
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import NetworkBanner from "./NetworkBanner";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-field">
      <AppHeader />
      <NetworkBanner />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
