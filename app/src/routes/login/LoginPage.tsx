// Phone OTP login (SPEC.md §4.2). No header/bottom nav - same as
// WelcomePage, nothing to navigate to before login. One 6-digit field for
// the code, not six boxes (simpler, autofills from SMS) - SPEC.md §4.2
// updated to match in the same change.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import LanguageSwitch from "@/components/shell/LanguageSwitch";
import { useAuth } from "@/app/authContext";
import { homeFor } from "@/lib/roles";
import { sendOtp, verifyOtp } from "@/services/auth";
import { toAppError } from "@/lib/errors";
import { Phone10 } from "@shared/schemas/profile.ts";

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, profile } = useAuth();

  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (status === "signedIn")
      navigate(profile ? homeFor(profile.role) : "/onboarding", { replace: true });
  }, [status, profile, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const phoneResult = Phone10.safeParse(phoneRaw);
  const canSend = phoneResult.success && !busy;
  const canVerify = code.length === 6 && !busy;

  async function handleSend() {
    if (!phoneResult.success) return;
    setError(null);
    setBusy(true);
    try {
      await sendOtp(phoneResult.data);
      setPhase("otp");
      setCode("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(t(toAppError(err).messageKey));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!phoneResult.success || code.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phoneResult.data, code);
    } catch (err) {
      setError(t(toAppError(err).messageKey));
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-field p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(31,107,58,0.05), transparent)",
        }}
      />

      <div className="relative flex items-center justify-between">
        {phase === "otp" ? (
          <button
            type="button"
            onClick={() => setPhase("phone")}
            aria-label={t("login.back")}
            className="flex h-12 w-12 items-center justify-center rounded-button text-title text-ink hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={24} />
          </button>
        ) : (
          <span />
        )}
        <LanguageSwitch />
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-sm">
        {phase === "phone" ? (
          <>
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-card bg-leaf shadow-[var(--shadow-soft)]">
                <span className="text-3xl">🌾</span>
              </div>
            </div>
            <label htmlFor="phone" className="block text-body font-semibold text-ink">
              {t("login.phoneLabel")}
            </label>
            <div className="mt-2 flex h-14 overflow-hidden rounded-button border border-line bg-surface shadow-[var(--shadow-soft)] focus-within:border-leaf">
              <span className="flex items-center border-r border-line-soft px-3 text-body text-ink-muted">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 px-3 text-body text-ink outline-none"
                placeholder={t("login.phonePlaceholder")}
              />
            </div>

            {error && <p className="mt-3 text-meta font-medium text-mirchi-text">{error}</p>}

            <button
              type="button"
              disabled={!canSend}
              onClick={() => void handleSend()}
              className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white shadow-[var(--shadow-soft)] disabled:opacity-40"
            >
              {t("login.sendOtp")}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="otp" className="block text-body font-semibold text-ink">
              {t("login.otpLabel")}
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 h-14 w-full rounded-button border border-line bg-surface text-center text-title tracking-[0.5em] text-ink shadow-[var(--shadow-soft)] outline-none focus:border-leaf"
            />

            {error && <p className="mt-3 text-meta font-medium text-mirchi-text">{error}</p>}

            <button
              type="button"
              disabled={!canVerify}
              onClick={() => void handleVerify()}
              className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white shadow-[var(--shadow-soft)] disabled:opacity-40"
            >
              {t("login.verify")}
            </button>

            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => void handleSend()}
              className="mt-3 h-12 w-full text-meta font-semibold text-leaf-dark disabled:text-ink-muted"
            >
              {resendIn > 0
                ? t("login.resendIn", { time: `0:${String(resendIn).padStart(2, "0")}` })
                : t("login.resend")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
