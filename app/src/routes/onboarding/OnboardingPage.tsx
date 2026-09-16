// First-time setup after login (SPEC.md §4.3), cut down to what 0.5 needs:
// role, then name. 1.1 extends this same screen with village, crops and GPS
// - keeping one file now avoids restructuring it later.
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/authContext";
import { homeFor } from "@/lib/roles";
import { createMyProfile } from "@/services/profiles";
import { toAppError } from "@/lib/errors";
import { SignupRole, type SignupRole as SignupRoleT } from "@shared/schemas/profile.ts";

const ROLES: { role: SignupRoleT; icon: string }[] = [
  { role: "farmer", icon: "🧑‍🌾" },
  { role: "buyer", icon: "🏢" },
  { role: "fpo", icon: "👥" },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [role, setRole] = useState<SignupRoleT | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const parsedRole = SignupRole.safeParse(role);
    if (!parsedRole.success || name.trim().length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const profile = await createMyProfile({ name: name.trim(), role: parsedRole.data });
      await refreshProfile();
      navigate(homeFor(profile.role), { replace: true });
    } catch (err) {
      setError(t(toAppError(err).messageKey));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-field p-4">
      <div className="mx-auto mt-10 w-full max-w-sm">
        <p className="text-card font-display text-ink">{t("onboarding.whoAreYou")}</p>

        <div
          role="group"
          aria-label={t("onboarding.whoAreYou")}
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {ROLES.map(({ role: r, icon }) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={
                "flex h-20 flex-col items-center justify-center gap-1 rounded-card border text-meta font-semibold " +
                (role === r
                  ? "border-leaf bg-leaf/10 text-leaf-dark"
                  : "border-line bg-surface text-ink")
              }
            >
              <span aria-hidden="true" className="text-title">
                {icon}
              </span>
              {t(`role.${r}`)}
            </button>
          ))}
        </div>

        <label htmlFor="name" className="mt-8 block text-body font-semibold text-ink">
          {t("onboarding.nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-14 w-full rounded-button border border-line bg-surface px-3 text-body text-ink outline-none"
          placeholder={t("onboarding.namePlaceholder")}
        />

        {error && <p className="mt-3 text-meta text-mirchi-text">{error}</p>}

        <button
          type="button"
          disabled={!role || name.trim().length === 0 || busy}
          onClick={() => void handleSubmit()}
          className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white disabled:opacity-40"
        >
          {t("onboarding.continue")}
        </button>
      </div>
    </div>
  );
}
