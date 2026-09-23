// Admin "Skip timer" queue (SPEC.md §5.2, §8.6, §9.2 Phase 4 "4.9") - every
// DELIVERED escrow waiting on the 24h auto-release timer or a driver
// entering the OTP. "Skip timer" only works in DEMO_MODE (escrow-skip-timer
// itself refuses otherwise, DEMO_ONLY) - it moves the timer to now and
// releases the escrow in the same call, so a demo doesn't wait.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowLeft, Inbox, Zap } from "lucide-react";
import { formatRupees } from "@shared/money.ts";
import type { Crop } from "@shared/crops.ts";
import Countdown from "@/components/money/Countdown";
import RequireOnline from "@/components/common/RequireOnline";
import { useDeliveredEscrows, useSkipTimer } from "@/services/escrow";
import { toAppError } from "@/lib/errors";

export default function AdminEscrowsPage() {
  const { t } = useTranslation();
  const { data: rows, isLoading } = useDeliveredEscrows();
  const skipTimer = useSkipTimer();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSkip(escrowId: string) {
    setError(null);
    setBusyId(escrowId);
    try {
      await skipTimer.mutateAsync({ escrowId });
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
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">{t("escrowAdmin.title")}</h1>
          <p className="text-meta font-medium text-ink-muted">{t("escrowAdmin.subtitle")}</p>
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
          <p className="mt-4 font-display text-xl font-bold text-ink">{t("escrowAdmin.empty")}</p>
        </div>
      ) : (
        <div className="divide-y divide-line/60 overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-card">
          {rows.map((row) => (
            <div key={row.escrow_id} className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-ink">{row.qr_code}</p>
                  <p className="text-meta text-ink-muted">{t(`crop.${row.crop as Crop}`)}</p>
                </div>
                <p className="shrink-0 font-display text-lg font-black tabular-nums text-ink">
                  {formatRupees(row.total_paise)}
                </p>
              </div>

              {row.auto_release_at && <Countdown until={row.auto_release_at} labelKey="escrowAdmin.releaseIn" />}

              <RequireOnline reasonKey="escrowAdmin.skipOffline">
                <button
                  type="button"
                  disabled={busyId === row.escrow_id}
                  onClick={() => void handleSkip(row.escrow_id)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-haldi/40 bg-haldi-light font-display text-base font-bold text-haldi-text shadow-xs transition-all hover:bg-haldi-light/80 active:scale-95 disabled:opacity-50"
                >
                  <Zap aria-hidden="true" size={18} />
                  {t("escrowAdmin.skipButton")}
                </button>
              </RequireOnline>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
