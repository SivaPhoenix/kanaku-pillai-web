import { cn } from "../../lib/cn.js";

export function Switch({ checked, onChange, label, disabled, className, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-block h-8 w-[52px] shrink-0 rounded-full transition-colors",
        // extends the hit area to 44px tall
        "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-text-muted",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] left-[3px] size-[26px] rounded-full bg-on-primary transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
