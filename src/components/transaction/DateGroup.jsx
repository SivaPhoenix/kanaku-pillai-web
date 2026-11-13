import { AmountText } from "../ui/AmountText.jsx";
import { formatLocalDate } from "../../lib/ledger-format.js";
import { TransactionRow } from "./TransactionRow.jsx";

// "Thu, 22 Oct · Today" with the day's net (income − expense, transfers excluded), then the day's rows.
export function DateGroup({ group, today, lookups, settings }) {
  const label = formatLocalDate(group.localDate, { locale: settings.locale });
  const relative = group.localDate === today ? " · Today" : null;
  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[13px] font-bold text-text-muted-2">
          {label}
          {relative}
        </h3>
        {group.netMinor !== 0 ? (
          <AmountText
            minor={Math.abs(group.netMinor)}
            type={group.netMinor > 0 ? "income" : "expense"}
            currencyCode={settings.currencyCode}
            locale={settings.locale}
            className="text-[13px]"
          />
        ) : null}
      </div>
      {group.items.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} lookups={lookups} settings={settings} />
      ))}
    </section>
  );
}
