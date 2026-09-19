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
      <h1 className="font-display text-3xl font-black tracking-tight text-ink">{t("nav.me")}</h1>

      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-surface p-6 shadow-hero transition-all duration-300">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-leaf-light to-terracotta-light/40 blur-2xl"
        />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-leaf/30 bg-gradient-to-br from-leaf-light to-surface text-leaf-dark shadow-glow-leaf">
            <User size={32} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl font-black text-ink">
              {profile?.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-leaf/30 bg-leaf-light px-3.5 py-0.5 font-display text-xs font-bold text-leaf-dark shadow-xs">
                {profile && t(`role.${profile.role}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact and details */}
        <div className="relative z-10 mt-5 space-y-2.5 border-t-2 border-line-subtle pt-4 text-sm text-ink-muted">
          {profile?.phone && (
            <div className="flex items-center gap-2 font-display">
              <Phone size={16} className="shrink-0 text-leaf" aria-hidden="true" />
              <span className="font-bold tabular-nums text-ink">{profile.phone}</span>
              <ShieldCheck size={16} className="text-leaf" aria-hidden="true" />
            </div>
          )}

          {profile?.lat !== null && profile?.lat !== undefined && (
            <div className="flex items-center gap-2 font-display">
              <MapPin size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="text-ink-muted font-bold">
                {profile.lat.toFixed(4)}, {profile.lng?.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Crops badges */}
        {crops.length > 0 && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-2 border-t-2 border-line-subtle pt-3.5">
            {crops.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-xl border border-leaf/25 bg-leaf-light px-3.5 py-1.5 font-display text-xs font-bold text-leaf-dark shadow-xs"
              >
                <span aria-hidden="true">{c === "onion" ? "🧅" : c === "tomato" ? "🍅" : "🥔"}</span>
                <span>{t(`crop.${c}`)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Language Preferences Card */}
      <div className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-ink">{t("lang.switchLabel")}</span>
          <LanguageSwitch />
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-mirchi/40 bg-gradient-to-r from-mirchi-light via-mirchi-light/90 to-surface font-display text-lg font-bold text-mirchi-text shadow-card transition-all duration-200 hover:bg-mirchi-light/80 active:scale-95"
      >
        <LogOut size={20} aria-hidden="true" />
        <span>{t("me.signOut")}</span>
      </button>
    </div>
  );
}
