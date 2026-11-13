import { cn } from "../../lib/cn.js";
import { Icon } from "./Icon.jsx";

const SIZES = { md: "size-11", lg: "size-13" };

export function IconButton({
  as: Component = "button",
  icon,
  label,
  size = "md",
  type = "button",
  className,
  ...rest
}) {
  return (
    <Component
      {...(Component === "button" ? { type } : {})}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg surface-l1 text-text",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZES[size],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "lg" ? 22 : 20} />
    </Component>
  );
}
