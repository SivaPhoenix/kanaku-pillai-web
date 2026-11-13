import { Link } from "react-router";
import { cn } from "../../lib/cn.js";
import { AmountText } from "../ui/AmountText.jsx";
import { BG_TONE, PILL_TONE } from "./tones.js";

// Ranked category row: tinted percent pill, name, amount and a bar sized relative to the largest item.
export function RankedRow({
  to,
  name,
  pct,
  amountMinor,
  tone,
  barPct,
  type,
  currencyCode,
  locale,
  className,
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-14 flex-col justify-center gap-1.5 rounded-xl px-2 py-2 hover:bg-primary/5",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-[13px] font-bold tabular",
            PILL_TONE[tone] ?? "bg-line text-text",
          )}
        >
          {Math.round(pct * 10) / 10}%
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">{name}</span>
        <AmountText
          minor={amountMinor}
          type={type}
          currencyCode={currencyCode}
          locale={locale}
          className="shrink-0 text-[15px] whitespace-nowrap"
        />
      </span>
      <span aria-hidden="true" className="block h-1.5 rounded-full bg-line">
        <span
          className={cn("block h-full rounded-full", BG_TONE[tone] ?? "bg-text-muted")}
          style={{ width: `${barPct}%` }}
        />
      </span>
    </Link>
  );
}
