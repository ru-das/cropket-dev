// Buyer KYC screen (SPEC.md §4.10 banner, §5.4 `kyc-verify`, §9.2 Phase 3
// "3.1"). KYC is money-adjacent (SPEC.md §10.3 "Money, bidding, consent,
// KYC ... never work offline") - submitKyc() is a direct online-only call,
// never queued to the outbox, so the submit button is disabled offline with
// a reason (same pattern OnboardingPage's last step uses).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Clock, ShieldX } from "lucide-react";
import { useAuth } from "@/app/authContext";
import { useOnline } from "@/offline/network";
import { useMyKyc, submitKyc } from "@/services/kyc";
import { toAppError, type AppError } from "@/lib/errors";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import VoiceButton from "@/components/voice/VoiceButton";
import { KycRequest } from "@shared/schemas/kyc.ts";

function verifiedDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export default function KycPage() {
  const { t, i18n } = useTranslation();
  const { refreshProfile } = useAuth();
  const online = useOnline();
  const { data: kyc, isLoading } = useMyKyc();

  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [pan, setPan] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setFieldError(null);
    setError(null);

    const parsed = KycRequest.safeParse({ businessName, gstNumber, pan });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? t("errors.unknown"));
      return;
    }

    setSaving(true);
    try {
      await submitKyc(parsed.data);
      await refreshProfile();
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <p className="font-display text-lg font-bold text-ink-muted">{t("common.loading")}</p>;
  }

  const canSubmit = businessName.trim().length >= 3 && gstNumber.trim().length > 0 && pan.trim().length > 0 && online && !saving;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">{t("kyc.title")}</h1>
        <VoiceButton textKey="kyc.title" className="h-11 w-11 shadow-xs" />
      </div>

      {kyc?.status === "verified" ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-pass/40 bg-pass-light/60 p-7 text-center shadow-hero">
          <VerifiedBadge verified size="lg" />
          <p className="font-display text-xl font-bold text-ink">{t("kyc.verifiedTitle")}</p>
          <p className="text-meta font-medium text-ink-muted">{kyc.business_name}</p>
          <p className="text-meta font-medium text-ink-muted">{t("kyc.panMasked", { last4: kyc.pan_last4 })}</p>
          {kyc.verified_at && (
            <p className="text-meta text-ink-muted">
              {t("kyc.verifiedSince", { date: verifiedDate(kyc.verified_at, i18n.language) })}
            </p>
          )}
        </div>
      ) : kyc?.status === "pending" ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-haldi/40 bg-haldi-light/60 p-7 text-center shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-haldi/30 bg-surface text-haldi-text shadow-xs">
            <Clock aria-hidden="true" size={26} />
          </div>
          <p className="font-display text-xl font-bold text-ink">{t("kyc.pendingTitle")}</p>
          <p className="text-meta font-medium text-ink-muted">{t("kyc.pendingBody")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {kyc?.status === "rejected" && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-4 shadow-card">
              <ShieldX aria-hidden="true" size={22} className="shrink-0 text-mirchi-text" />
              <div>
                <p className="font-display text-base font-bold text-mirchi-text">{t("kyc.rejectedTitle")}</p>
                <p className="text-meta text-mirchi-text/90">{t("kyc.rejectedBody")}</p>
              </div>
            </div>
          )}

          <p className="text-meta font-medium text-ink-muted">{t("kyc.subtitle")}</p>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-meta font-bold text-ink">{t("kyc.businessNameLabel")}</span>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t("kyc.businessNamePlaceholder")}
              className="h-14 rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-meta font-bold text-ink">{t("kyc.gstLabel")}</span>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder={t("kyc.gstPlaceholder")}
              autoCapitalize="characters"
              maxLength={15}
              className="h-14 rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold uppercase tracking-wide text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-meta font-bold text-ink">{t("kyc.panLabel")}</span>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder={t("kyc.panPlaceholder")}
              autoCapitalize="characters"
              maxLength={10}
              className="h-14 rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold uppercase tracking-wide text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            />
          </label>

          {(fieldError || error) && (
            <p className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-3.5 text-meta font-semibold text-mirchi-text shadow-xs">
              {fieldError ?? (error ? t(error.messageKey) : "")}
            </p>
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="mt-2 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-leaf px-6 font-display text-xl font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
          >
            <ShieldCheck aria-hidden="true" size={22} />
            {kyc?.status === "rejected" ? t("kyc.resubmit") : t("kyc.submit")}
          </button>
          {!online && <p className="text-center text-meta text-ink-muted">{t("kyc.needsInternet")}</p>}
        </div>
      )}
    </div>
  );
}
