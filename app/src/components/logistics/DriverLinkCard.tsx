// The farmer's own "make a driver link" card (SPEC.md §4.14, §4.16, §5.4,
// §9.2 Phase 4 "4.7"). Shown on LotDetailPage once the escrow is
// IN_TRANSIT (4.6's "Mark dispatched"). DESIGN.md §2.2: neel (cobalt) is
// the logistics colour everywhere in this app.
//
// The trip link is shown exactly once - right after shipments-create
// returns it - and never again (only its hash is ever stored, see
// services/shipments.ts). A reload after that shows "Driver link made for
// <plate>" instead of the link itself; "Make a new link" is the only way
// back to a working one (decided with the user, docs/progress.md 4.7).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Truck, Copy, Share2, Check } from "lucide-react";
import VoiceButton from "@/components/voice/VoiceButton";
import RequireOnline from "@/components/common/RequireOnline";
import DemoDataTag from "@/components/common/DemoDataTag";
import { useShipmentForDeal, useCreateShipment } from "@/services/shipments";
import { toAppError, type AppError } from "@/lib/errors";

type Props = { dealId: string };

export default function DriverLinkCard({ dealId }: Props) {
  const { t } = useTranslation();
  const { data: shipment, isLoading } = useShipmentForDeal(dealId);
  const createShipment = useCreateShipment(dealId);

  const [vehicleInput, setVehicleInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [tripUrl, setTripUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Falls back to an existing shipment's own values until the farmer types
  // something - "Make a new link" then starts from the same driver/vehicle
  // instead of a blank form, with no effect needed to copy them in.
  const vehicleNumber = vehicleInput || shipment?.vehicleNumber || "";
  const driverPhone = phoneInput || shipment?.driverPhone || "";

  async function handleSend() {
    setError(null);
    try {
      const result = await createShipment.mutateAsync({ dealId, driverPhone, vehicleNumber });
      setTripUrl(result.tripUrl);
      setEditing(false);
    } catch (err) {
      setError(toAppError(err));
    }
  }

  async function handleCopy() {
    if (!tripUrl) return;
    await navigator.clipboard.writeText(tripUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!tripUrl) return;
    if (navigator.share) await navigator.share({ url: tripUrl }).catch(() => {});
    else await handleCopy();
  }

  if (isLoading) return null;

  const canSend = driverPhone.trim().length === 10 && vehicleNumber.trim().length > 0 && !createShipment.isPending;

  // Just made (or remade) a link this session - the one time the real URL
  // is on screen.
  if (tripUrl) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-neel/30 bg-neel-light p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-neel-text shadow-xs">
            <Truck aria-hidden="true" size={20} />
          </div>
          <p className="font-display text-meta font-bold text-neel-text">
            {t("lots.deal.driverLinkMade", { vehicle: vehicleNumber })}
          </p>
        </div>
        <p className="break-all rounded-xl border border-line bg-surface px-3 py-2 font-body text-sm text-ink">
          {tripUrl}
        </p>
        <DemoDataTag />
        <p className="text-meta text-ink-muted">{t("lots.deal.driverLinkNote")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface font-display text-base font-bold text-ink shadow-xs transition-all active:scale-[0.98]"
          >
            {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            <span>{copied ? t("lots.deal.driverLinkCopied") : t("lots.deal.driverLinkCopy")}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface font-display text-base font-bold text-ink shadow-xs transition-all active:scale-[0.98]"
          >
            <Share2 aria-hidden="true" size={18} />
            <span>{t("lots.deal.driverLinkShare")}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setTripUrl(null);
            setEditing(true);
          }}
          className="text-center text-meta font-semibold text-neel-text underline underline-offset-2"
        >
          {t("lots.deal.driverLinkMakeNew")}
        </button>
      </div>
    );
  }

  // A shipment already exists (e.g. after a reload) but the link is gone
  // from memory - only "Make a new link" gets a working one back.
  if (shipment && !editing) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border-2 border-neel/30 bg-neel-light p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-neel-text shadow-xs">
            <Truck aria-hidden="true" size={20} />
          </div>
          <p className="font-display text-meta font-bold text-neel-text">
            {t("lots.deal.driverLinkExists", { vehicle: shipment.vehicleNumber })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-center text-meta font-semibold text-neel-text underline underline-offset-2"
        >
          {t("lots.deal.driverLinkMakeNew")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-neel/30 bg-neel-light p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-neel-text shadow-xs">
          <Truck aria-hidden="true" size={20} />
        </div>
        <p className="font-display text-meta font-bold text-neel-text">{t("lots.deal.driverLinkTitle")}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-meta font-bold text-ink">{t("lots.deal.driverLinkVehicleLabel")}</span>
        <input
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleInput(e.target.value.toUpperCase())}
          placeholder={t("lots.deal.driverLinkVehiclePlaceholder")}
          autoCapitalize="characters"
          className="h-14 rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold uppercase tracking-wide text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-meta font-bold text-ink">{t("lots.deal.driverLinkPhoneLabel")}</span>
        <input
          type="tel"
          inputMode="numeric"
          value={driverPhone}
          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={t("lots.deal.driverLinkPhonePlaceholder")}
          className="h-14 rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold tabular-nums text-ink shadow-card outline-none transition-all focus:border-leaf focus:ring-4 focus:ring-leaf/15"
        />
      </label>

      {error && <p className="text-center text-meta font-semibold text-mirchi-text">{t(error.messageKey)}</p>}

      <RequireOnline reasonKey="lots.deal.driverLinkOffline">
        <button
          type="button"
          disabled={!canSend}
          onClick={() => void handleSend()}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-leaf font-display text-lg font-bold text-white shadow-hero transition-all hover:bg-leaf-hover active:scale-[0.98] disabled:bg-line disabled:text-ink-muted disabled:shadow-none"
        >
          <Truck aria-hidden="true" size={20} />
          <span>{t("lots.deal.driverLinkSend")}</span>
        </button>
      </RequireOnline>
      <VoiceButton textKey="lots.deal.driverLinkTitle" className="mx-auto h-9 w-9 shadow-xs" />
    </div>
  );
}
