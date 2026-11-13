import { useId } from "react";
import { cn } from "../../lib/cn.js";

const SIGN = { income: "+", expense: "−", transfer: "" };
const COLOR = { income: "text-income", expense: "text-expense", transfer: "text-transfer" };

function currencySymbol(currencyCode, locale) {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currencyCode;
}

// Large mono amount input, prefixed with the sign and currency symbol and coloured by entry type.
export function AmountField({ ref, type, currencyCode, locale, error, ...rest }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-text-muted-2">
        AMOUNT
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg surface-l0 px-4 py-2 font-mono",
          error && "border-danger",
          COLOR[type],
        )}
      >
        <span
          aria-hidden="true"
          className="text-[46px] leading-none font-semibold tablet:text-[50px]"
        >
          {SIGN[type]}
          {currencySymbol(currencyCode, locale)}
        </span>
        <input
          ref={ref}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent text-[46px] leading-none font-semibold tabular outline-none placeholder:text-text-muted tablet:text-[50px]"
          {...rest}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
