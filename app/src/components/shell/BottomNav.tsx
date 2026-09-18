// Bottom tab bar, one set of tabs per role (SPEC.md §3.1, §4.4: farmer gets
// "🏠 Home 📦 Lots 📒 Khata 👤 Me"). Buyer, FPO and admin only have one real
// screen so far (their marketplace/mega-lot/dispute screens land in M3/M4) -
// a nav bar needs at least two places to go, so they get none yet, same as
// the desktop-only admin role.
import { Home, Package, BookText, User } from "lucide-react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/authContext";

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

export default function BottomNav() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const tabs = profile ? TABS_BY_ROLE[profile.role] : [];

  if (tabs.length === 0) return null;

  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-line bg-surface/95 px-2 py-1 shadow-dock backdrop-blur-md">
      {tabs.map(({ to, labelKey, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-meta transition-all duration-150 active:scale-95",
              isActive
                ? "bg-leaf-light font-bold text-leaf-dark shadow-xs"
                : "font-medium text-ink-muted hover:text-ink",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                aria-hidden="true"
                size={22}
                className={cn("transition-transform duration-150", isActive && "scale-110")}
              />
              <span className="text-xs leading-none tracking-tight">{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
