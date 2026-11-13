import { cn } from "../../lib/cn.js";
import { Icon } from "./Icon.jsx";

const VARIANTS = {
  primary: "bg-primary text-on-primary",
  secondary: "surface-l1 text-text",
  ghost: "font-bold text-link",
  danger: "border-[1.5px] border-danger text-danger",
  "danger-solid": "bg-danger-solid text-white",
  hairline: "border border-line font-bold text-link",
};

const SIZES = {
  md: "h-[50px] min-w-11 px-5 text-[15px]",
  lg: "h-14 min-w-11 px-6 text-base",
};

export function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}) {
  const isNativeButton = Component === "button";
  const isDisabled = Boolean(disabled) || loading;
  return (
    <Component
      {...(isNativeButton ? { type, disabled: isDisabled } : {})}
      aria-busy={loading || undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold select-none",
        isDisabled && "cursor-not-allowed opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : leftIcon ? (
        <Icon name={leftIcon} size={18} />
      ) : null}
      {children}
    </Component>
  );
}
