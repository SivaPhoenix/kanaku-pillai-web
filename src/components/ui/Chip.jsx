import { cn } from "../../lib/cn.js";

const TONES = {
  primary: "border-primary bg-primary/18",
  income: "border-income bg-income/18",
  expense: "border-expense bg-expense/18",
  transfer: "border-transfer bg-transfer/18",
  c1: "border-c1 bg-c1/18",
  c2: "border-c2 bg-c2/18",
  c3: "border-c3 bg-c3/18",
  c4: "border-c4 bg-c4/18",
  c5: "border-c5 bg-c5/18",
  c6: "border-c6 bg-c6/18",
  c7: "border-c7 bg-c7/18",
};

export function Chip({
  selected = false,
  tone = "primary",
  type = "button",
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-[14px] text-text",
        selected
          ? cn("border-[1.5px] font-bold", TONES[tone])
          : "border border-surface-0-border bg-surface-0 font-medium",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
