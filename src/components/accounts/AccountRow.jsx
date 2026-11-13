import { cn } from "../../lib/cn.js";
import { IconTile } from "../transaction/IconTile.jsx";
import { AmountText } from "../ui/index.js";

// Sub-line under the account name (spec §7.10).
function accountSubline(account, accounts) {
  if (account.type === "debit_card") {
    const bank = accounts.find((a) => a.id === account.linkedAccountId);
    return `Spends from ${bank?.name ?? "linked bank"}`;
  }
  if (account.type === "bank") {
    const card = accounts.find((a) => a.type === "debit_card" && a.linkedAccountId === account.id);
    if (card) return `Debit card ${card.last4 ? `••${card.last4} ` : ""}spends from here`;
    return account.last4 ? `••${account.last4}` : "Bank account";
  }
  if (account.type === "investment") return "Money moved in via transfers";
  if (account.type === "credit_card")
    return account.last4 ? `Card ••${account.last4}` : "Credit card";
  return account.isDefault ? "Default" : "Cash in hand";
}

// A tappable account row; `trailing` holds optional extra controls (reorder buttons).
export function AccountRow({ account, accounts, money, hidden, onSelect, trailing, className }) {
  const showAmount = account.type !== "debit_card";
  const minor = account.type === "credit_card" ? account.owedMinor : account.balanceMinor;
  return (
    <div className={cn("flex items-center gap-1 rounded-xl surface-l0", className)}>
      <button
        type="button"
        onClick={() => onSelect(account)}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-primary/5"
      >
        <IconTile icon={account.icon} tone={account.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text">{account.name}</span>
          <span className="block truncate text-[13px] text-text-muted">
            {accountSubline(account, accounts)}
          </span>
        </span>
        {showAmount ? (
          <AmountText
            minor={minor ?? 0}
            {...money}
            hidden={hidden}
            className={cn(
              "shrink-0 text-[15px] whitespace-nowrap",
              account.type === "credit_card" && "text-expense",
            )}
          />
        ) : null}
      </button>
      {trailing}
    </div>
  );
}
