import { cn } from "../../lib/cn.js";
import { formatLocalDate } from "../../lib/ledger-format.js";
import { formatMoney } from "../../lib/money.js";
import { barCap, barPercent } from "./chart-math.js";

// One column per day of the month (expense only); each column is a button that selects the day.
export function DailyBars({ days, selected, today, onSelect, currencyCode, locale, className }) {
  const cap = barCap(days.map((d) => d.expenseMinor));
  return (
    <div
      className={cn("flex h-40 items-stretch gap-0.5", className)}
      role="group"
      aria-label="Spending by day"
    >
      {days.map((day) => {
        const future = day.localDate > today;
        const isSelected = day.localDate === selected;
        const percent = future ? 0 : barPercent(day.expenseMinor, cap);
        const amount = formatMoney(day.expenseMinor, { currencyCode, locale });
        return (
          <button
            key={day.localDate}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${formatLocalDate(day.localDate, { locale })}: ${amount} spent`}
            onClick={() => onSelect(day.localDate)}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm hover:bg-primary/5"
          >
            <span className="flex w-full flex-1 items-end justify-center">
              <span
                className={cn(
                  "w-full max-w-4 rounded-sm",
                  isSelected ? "bg-primary" : percent > 0 ? "bg-primary/40" : "bg-line",
                  percent === 0 && "h-1",
                )}
                style={percent > 0 ? { height: `${percent}%` } : undefined}
              />
            </span>
            <span aria-hidden="true" className="text-[10px] text-text-muted tabular">
              {Number(day.localDate.slice(8))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
