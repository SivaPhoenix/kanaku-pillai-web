import { Link } from "react-router";
import { formatLocalDate } from "../../lib/ledger-format.js";
import { IconTile } from "../transaction/IconTile.jsx";
import { AmountText, Button } from "../ui/index.js";

// Credit card with outstanding amount, bill line, limit bar and a Pay bill deep link (spec §7.10).
export function CreditCardBlock({ account, defaultBank, money, hidden, onSelect }) {
  const hasStatement = account.dueDate && account.statementMinor !== null;
  const pct = account.limitUsedPct;
  const payAmount = account.statementMinor || account.owedMinor || 0;
  const params = new URLSearchParams({ type: "transfer" });
  if (defaultBank) params.set("from", defaultBank.id);
  params.set("to", account.id);
  if (payAmount > 0) params.set("amount", String(payAmount));

  return (
    <div className="flex flex-col gap-3 rounded-xl surface-l0 p-3">
      <button
        type="button"
        onClick={() => onSelect(account)}
        className="flex min-h-11 items-center gap-3 rounded-lg text-left"
      >
        <IconTile icon={account.icon} tone={account.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text">{account.name}</span>
          <span className="block truncate text-[13px] text-text-muted">
            {account.last4 ? `Card ••${account.last4}` : "Credit card"}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <AmountText
            minor={account.owedMinor ?? 0}
            {...money}
            hidden={hidden}
            className="block text-[15px] whitespace-nowrap text-expense"
          />
          <span className="block text-[13px] text-text-muted">outstanding</span>
        </span>
      </button>

      {hasStatement ? (
        <p className="text-[13px] text-text-muted">
          Bill due {formatLocalDate(account.dueDate, { locale: money.locale })} {"·"} statement{" "}
          <AmountText
            minor={account.statementMinor}
            {...money}
            hidden={hidden}
            className="text-[13px] font-semibold text-text-muted"
          />
        </p>
      ) : null}

      {pct !== null && pct !== undefined ? (
        <div className="flex flex-col gap-1.5">
          <div
            role="progressbar"
            aria-label="Credit limit used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className="h-1.5 overflow-hidden rounded-full bg-primary/15"
          >
            <div
              className="h-full w-(--pct) rounded-full bg-expense"
              style={{ "--pct": `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="text-[13px] text-text-muted">
            {pct}% of{" "}
            <AmountText
              minor={account.creditLimitMinor ?? 0}
              {...money}
              hidden={hidden}
              className="text-[13px] font-semibold text-text-muted"
            />{" "}
            limit used
          </p>
        </div>
      ) : null}

      <Button
        as={Link}
        to={`/add?${params.toString()}`}
        variant="hairline"
        fullWidth
        className="text-center"
      >
        {defaultBank ? `Pay bill — transfer from ${defaultBank.name}` : "Pay bill"}
      </Button>
    </div>
  );
}
