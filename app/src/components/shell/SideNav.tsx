// Sidebar navigation for md+ screens. On mobile this renders nothing — the
// BottomNav handles mobile. On md the sidebar is a 64px icon-only rail; on
// lg it expands to 220px showing icon + label, matching the BottomNav tab set
// for each role. Branding (logo + app name) lives here on desktop so the
// top header can stay compact. (SPEC.md §3.1, §4.4)
import { Home, Package, BookText, User } from "lucide-react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/authContext";
import SyncStatus from "./SyncStatus";
import { useOutboxStatus } from "@/offline/outbox";

const TABS_BY_ROLE = {
  farmer: [
    { to: "/farmer", labelKey: "nav.home", Icon: Home, end: true },
    { to: "/farmer/lots", labelKey: "nav.lots", Icon: Package, end: false },
    { to: "/farmer/khata", labelKey: "nav.khata", Icon: BookText, end: false },
    { to: "/farmer/me", labelKey: "nav.me", Icon: User, end: false },
  ],
  buyer: [],
  fpo: [],
  admin: [],
  nbfc: [],
} as const;

export default function SideNav() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { unresolved } = useOutboxStatus();
  const tabs = profile ? TABS_BY_ROLE[profile.role] : [];

  // Only render on md+ — mobile uses BottomNav
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label={t("nav.sidebarLabel")}
      className={cn(
        // Hidden on mobile; visible as a rail on md, expands on lg
        "hidden md:flex md:w-16 lg:w-[220px]",
        "flex-col border-r-2 border-line/70 bg-surface/95 backdrop-blur-xl",
        "sticky top-0 h-screen shrink-0",
      )}
    >
      {/* Brand mark — compact on md rail, full on lg sidebar */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-line/70 px-3 lg:px-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-leaf/30 bg-gradient-to-br from-leaf-light via-leaf-light/80 to-terracotta-light text-xl shadow-xs"
        >
          🌾
        </span>
        {/* App name only shows on lg+ sidebar */}
        <span className="hidden font-display text-xl font-black tracking-tight text-ink lg:block">
          {t("app.name")}
        </span>
      </div>

      {/* Nav links */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 lg:p-3">
        {tabs.map(({ to, labelKey, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                // Rail: icon centred; sidebar: icon + label row
                "group relative flex items-center gap-3 rounded-2xl transition-all duration-200",
                "min-h-12 px-3 md:justify-center lg:justify-start lg:px-4",
                isActive
                  ? "bg-gradient-to-r from-leaf-light to-leaf-light/60 font-black text-leaf-dark border border-leaf/25 shadow-xs"
                  : "font-semibold text-ink-muted hover:bg-field hover:text-ink",
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active dot indicator */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1.5 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-leaf shadow-glow-leaf lg:block"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  size={22}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    isActive ? "text-leaf-dark scale-110 stroke-[2.5]" : "text-ink-muted group-hover:text-ink",
                  )}
                />
                {/* Label only on lg+ sidebar */}
                <span className="hidden font-display text-sm leading-none tracking-tight lg:block">
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Sync status at bottom of sidebar */}
      <div className="flex items-center justify-center border-t-2 border-line/70 p-3 lg:justify-start lg:px-5">
        <SyncStatus pending={unresolved} total={unresolved} />
      </div>
    </nav>
  );
}
