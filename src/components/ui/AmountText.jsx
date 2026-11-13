import { cn } from "../../lib/cn.js";
import { formatMoney } from "../../lib/money.js";

const TYPE_COLOR = {
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
};

function currencySymbol(currencyCode, locale) {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currencyCode;
}

export function AmountText({
  minor,
  type,
  currencyCode = "INR",
  locale = "en-IN",
  hidden = false,
  className,
}) {
  const text = hidden
    ? `${currencySymbol(currencyCode, locale)} ••••`
    : formatMoney(minor, { currencyCode, locale, type });
  return (
    <span
      aria-label={hidden ? "Amount hidden" : undefined}
      className={cn("font-mono font-semibold tabular", TYPE_COLOR[type] ?? "text-text", className)}
    >
      {text}
    </span>
  );
}
