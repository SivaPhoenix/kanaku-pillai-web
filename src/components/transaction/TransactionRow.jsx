import { Link } from "react-router";
import { cn } from "../../lib/cn.js";
import { formatTime } from "../../lib/ledger-format.js";
import { describeTransaction } from "../../lib/transaction-display.js";
import { AmountText } from "../ui/AmountText.jsx";
import { IconTile } from "./IconTile.jsx";

// One entry (spec §4 Transaction row): icon tile, title, "Category · Account · time", signed amount. Opens the detail.
export function TransactionRow({ tx, lookups, settings, showTime = true, className }) {
  const { title, meta, icon, tone } = describeTransaction(tx, lookups);
  const time = showTime
    ? formatTime(tx.occurredAt, { locale: settings.locale, timeZone: tx.tzid })
    : null;
  return (
    <Link
      to={`/tx/${tx.id}`}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl surface-l0 px-3 py-2.5 hover:bg-primary/5",
        className,
      )}
    >
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-text">{title}</span>
        <span className="block truncate text-[13px] text-text-muted">
          {[meta, time].filter(Boolean).join(" · ")}
        </span>
      </span>
      <AmountText
        minor={tx.amountMinor}
        type={tx.type}
        currencyCode={tx.currencyCode}
        locale={settings.locale}
        className="shrink-0 text-[15px] whitespace-nowrap"
      />
    </Link>
  );
}
