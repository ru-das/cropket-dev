// Wraps a money or trading action (AGENTS.md §4 "wrap money and trading
// buttons in <RequireOnline reasonKey=...>"). Offline -> the child is
// disabled and a calm reason line shows beneath it; nothing here queues
// anything, money/trading actions are online-only (AGENTS.md §4) and never
// go in the outbox. LotDetailPage's "Sell on Cropket" button inlines this
// same disabled-with-a-reason pattern by hand; LiveBidBox (3.3) is what
// pulls it out into a shared component, for 3.5/3.6/M4 to reuse next.
import type { ReactElement } from "react";
import { cloneElement } from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { useOnline } from "@/offline/network";

type Props = {
  reasonKey: ParseKeys;
  children: ReactElement<{ disabled?: boolean }>;
};

export default function RequireOnline({ reasonKey, children }: Props) {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <div className="flex flex-col gap-2">
      {cloneElement(children, { disabled: !online || children.props.disabled })}
      {!online && <p className="text-center text-meta text-ink-muted">{t(reasonKey)}</p>}
    </div>
  );
}
