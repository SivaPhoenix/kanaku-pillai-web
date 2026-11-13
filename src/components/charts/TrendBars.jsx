import { cn } from "../../lib/cn.js";
import { compactAmount, formatMonth, formatMonthShort } from "../../lib/ledger-format.js";
import { formatMoney } from "../../lib/money.js";

// Monthly totals; points before the last six are hidden until the large breakpoint.
export function TrendBars({ points, currentMonth, currencyCode, locale, className }) {
  const max = Math.max(0, ...points.map((p) => p.amountMinor));
  return (
    <ol className={cn("flex h-44 items-stretch gap-2", className)} aria-label="Monthly trend">
      {points.map((point, index) => {
        const isCurrent = point.month === currentMonth;
        const percent =
          max > 0 ? Math.max(point.amountMinor > 0 ? 4 : 0, (point.amountMinor / max) * 100) : 0;
        const amount = formatMoney(point.amountMinor, { currencyCode, locale });
        return (
          <li
            key={point.month}
            aria-label={`${formatMonth(point.month, { locale })}: ${amount}`}
            className={cn(
              "min-w-0 flex-1 flex-col items-center justify-end gap-1",
              index < points.length - 6 ? "hidden large:flex" : "flex",
            )}
          >
            <span aria-hidden="true" className="text-[12px] font-semibold text-text-muted tabular">
              {compactAmount(point.amountMinor, { currencyCode, locale })}
            </span>
            <span className="flex w-full flex-1 items-end justify-center">
              <span
                aria-hidden="true"
                className={cn(
                  "w-full max-w-10 rounded-sm",
                  isCurrent ? "bg-primary" : "bg-primary/40",
                  percent === 0 && "h-1 bg-line",
                )}
                style={percent > 0 ? { height: `${percent}%` } : undefined}
              />
            </span>
            <span aria-hidden="true" className="text-[12px] text-text-muted">
              {formatMonthShort(point.month, { locale })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
