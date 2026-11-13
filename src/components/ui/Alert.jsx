import { cn } from "../../lib/cn.js";
import { Icon } from "./Icon.jsx";

const TONES = {
  danger: "border-l-danger",
  warning: "border-l-warning",
};

const ICON_TONES = {
  danger: "text-danger",
  warning: "text-warning",
};

export function Alert({ tone = "danger", className, children }) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-l-[3px] border-surface-0-border bg-surface-0 p-3 text-[14px] text-text",
        TONES[tone],
        className,
      )}
    >
      <Icon name="warning" size={18} className={cn("mt-0.5 shrink-0", ICON_TONES[tone])} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
