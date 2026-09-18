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
    <div className="mx-auto flex max-w-[260px] flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white p-5 shadow-card">
      <div className="rounded-xl border border-line-subtle bg-white p-2.5">
        <QRCodeSVG value={lotId} size={160} />
      </div>
      <div className="flex flex-col items-center">
        <span className="font-display text-2xl font-bold tracking-wider text-ink tabular-nums">{code}</span>
      </div>
    </div>
  );
}
