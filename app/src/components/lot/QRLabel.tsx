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
    <div className="mx-auto flex max-w-[280px] flex-col items-center gap-4 rounded-3xl border-3 border-dashed border-line bg-white p-6 shadow-premium">
      <div className="rounded-2xl border-2 border-line bg-surface p-3 shadow-xs">
        <QRCodeSVG value={lotId} size={170} />
      </div>
      <div className="flex flex-col items-center">
        <span className="font-display text-3xl font-black tracking-widest text-ink tabular-nums">{code}</span>
      </div>
    </div>
  );
}
