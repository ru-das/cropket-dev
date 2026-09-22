// Admin KYC approve queue (SPEC.md §9.5 "Buyer KYC | Mock (+ admin approve
// button)", §9.2 Phase 3 "3.1"). Approve/reject writes straight to
// buyer_kyc.status (RLS: admin-only update grant on that one column) - no
// new Edge Function needed, the buyer_kyc_sync trigger
// (20260922120000_buyer_kyc.sql) mirrors the result into profiles.kyc_status
// in the same transaction.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowLeft, Check, X, Inbox } from "lucide-react";
import { usePendingKyc, setKycStatus, type KycStatus } from "@/services/kyc";
import DemoDataTag from "@/components/common/DemoDataTag";
import { toAppError } from "@/lib/errors";

const STATUS_TONE: Record<KycStatus, string> = {
  pending: "border-haldi/30 bg-haldi-light text-haldi-text",
  verified: "border-pass/30 bg-pass-light text-pass-text",
  rejected: "border-mirchi/30 bg-mirchi-light text-mirchi-text",
};

export default function AdminKycPage() {
  const { t, i18n } = useTranslation();
  const { data: rows, isLoading } = usePendingKyc();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(buyerId: string, status: "verified" | "rejected") {
    setError(null);
    setBusyId(buyerId);
    try {
      await setKycStatus(buyerId, status);
    } catch (err) {
      setError(t(toAppError(err).messageKey));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2.5">
        <Link
          to="/admin"
          aria-label={t("onboarding.back")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface shadow-xs active:scale-90 transition-all hover:border-leaf"
        >
          <ArrowLeft aria-hidden="true" size={20} className="text-ink" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">{t("kyc.adminTitle")}</h1>
          <p className="text-meta font-medium text-ink-muted">{t("kyc.adminSubtitle")}</p>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border-2 border-mirchi/40 bg-mirchi-light p-3.5 text-meta font-semibold text-mirchi-text shadow-xs">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="font-display text-lg font-bold text-ink-muted">{t("common.loading")}</p>
      ) : !rows || rows.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line bg-surface p-8 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-line bg-surface-subtle text-ink-muted">
            <Inbox size={28} aria-hidden="true" />
          </div>
          <p className="mt-4 font-display text-xl font-bold text-ink">{t("kyc.adminEmpty")}</p>
        </div>
      ) : (
        <div className="divide-y divide-line/60 overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-card">
          {rows.map((row) => {
            const status = row.status as KycStatus;
            return (
              <div key={row.buyer_id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-ink">{row.business_name}</p>
                    <p className="text-meta text-ink-muted">{row.gst_number}</p>
                    <p className="text-meta text-ink-muted">{t("kyc.panMasked", { last4: row.pan_last4 })}</p>
                    <p className="mt-1 text-meta text-ink-muted">
                      {t("kyc.submittedOn", {
                        date: new Intl.DateTimeFormat(i18n.language, {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(row.created_at)),
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full border px-3 py-0.5 font-display text-xs font-bold ${STATUS_TONE[status]}`}
                    >
                      {t(`kyc.status.${status}`)}
                    </span>
                    {row.source === "mock" && <DemoDataTag />}
                  </div>
                </div>

                {status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busyId === row.buyer_id}
                      onClick={() => void handleDecide(row.buyer_id, "verified")}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-pass/40 bg-pass-light font-display text-base font-bold text-pass-text shadow-xs transition-all hover:bg-pass-light/80 active:scale-95 disabled:opacity-50"
                    >
                      <Check aria-hidden="true" size={18} />
                      {t("kyc.approve")}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.buyer_id}
                      onClick={() => void handleDecide(row.buyer_id, "rejected")}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-mirchi/40 bg-mirchi-light font-display text-base font-bold text-mirchi-text shadow-xs transition-all hover:bg-mirchi-light/80 active:scale-95 disabled:opacity-50"
                    >
                      <X aria-hidden="true" size={18} />
                      {t("kyc.reject")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
