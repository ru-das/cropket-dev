// Bottom tab bar, farmer routes (SPEC.md §4.4: "🏠 Home 📦 Lots 📒 Khata 👤 Me").
// Icon + word together, never colour alone (SPEC.md §6.1) - the active tab
// also gets a top colour bar so it doesn't rely on the leaf-green text alone.
import { Home, Package, BookText, User } from "lucide-react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/farmer", labelKey: "nav.home", Icon: Home, end: true },
  { to: "/farmer/lots", labelKey: "nav.lots", Icon: Package, end: false },
  { to: "/farmer/khata", labelKey: "nav.khata", Icon: BookText, end: false },
  { to: "/farmer/me", labelKey: "nav.me", Icon: User, end: false },
] as const;

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-line bg-surface">
      {TABS.map(({ to, labelKey, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-[3px] py-1 text-meta",
              isActive ? "border-leaf text-leaf-dark font-semibold" : "border-transparent text-ink-muted",
            )
          }
        >
          <Icon aria-hidden="true" size={22} />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
