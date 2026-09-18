// Farmer's own profile + sign out (SPEC.md §4.4 "👤 Me" tab). This is how
// login/logout gets hand-tested until a real profile-edit screen exists.
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { LogOut, User, Phone, ShieldCheck, MapPin } from "lucide-react";
import type { Crop } from "@shared/crops.ts";
import { useAuth } from "@/app/authContext";
import LanguageSwitch from "@/components/shell/LanguageSwitch";
import { signOut } from "@/services/auth";

export default function MePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const crops = (profile?.crops ?? []) as Crop[];

  return (
    <div className="space-y-5">
      {/* Title */}
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t("nav.me")}</h1>

      {/* Profile Card */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf-light text-leaf-dark">
            <User size={28} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-bold text-ink">
              {profile?.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-line-subtle bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                {profile && t(`role.${profile.role}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact and details */}
        <div className="mt-4 space-y-2 border-t border-line-subtle pt-3 text-xs text-ink-muted">
          {profile?.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="shrink-0 text-leaf" aria-hidden="true" />
              <span className="font-medium tabular-nums text-ink">{profile.phone}</span>
              <ShieldCheck size={14} className="text-leaf" aria-hidden="true" />
            </div>
          )}

          {profile?.lat !== null && profile?.lat !== undefined && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="font-mono text-ink-muted">
                {profile.lat.toFixed(4)}, {profile.lng?.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Crops badges */}
        {crops.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line-subtle pt-2">
            {crops.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-lg bg-leaf-light px-2.5 py-1 text-xs font-semibold text-leaf-dark"
              >
                <span aria-hidden="true">{c === "onion" ? "🧅" : c === "tomato" ? "🍅" : "🥔"}</span>
                <span>{t(`crop.${c}`)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Language Preferences Card */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-body font-semibold text-ink">{t("lang.switchLabel")}</span>
          <LanguageSwitch />
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-mirchi/40 bg-mirchi-light text-body font-bold text-mirchi-text shadow-xs transition-transform hover:bg-mirchi/15 active:scale-97"
      >
        <LogOut size={18} aria-hidden="true" />
        <span>{t("me.signOut")}</span>
      </button>
    </div>
  );
}
