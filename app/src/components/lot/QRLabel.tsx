// Lot's QR square + human code (SPEC.md §4.7, §5.1 "QRLabel"). The QR
// encodes the lot's full id (unique); the code under it is lotCode(id) - a
// short number a person can read aloud or type by hand. Renders as an
// SVG, so it's crisp offline and when printed - no CDN, no network.
// `printable` (the 12-per-A4 crate sticker sheet, SPEC.md §9.2 Phase 1 P1)
// is not built yet - out of prototype scope (CLAUDE.md §9.5).
import { QRCodeSVG } from "qrcode.react";

type Props = {
  lotId: string;
  code: string;
};

export default function QRLabel({ lotId, code }: Props) {
  return (
    <div className="mx-auto flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-4">
      <QRCodeSVG value={lotId} size={160} />
      <span className="text-title font-display text-ink">{code}</span>
    </div>
  );
}
