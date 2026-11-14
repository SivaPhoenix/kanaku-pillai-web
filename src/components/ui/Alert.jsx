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

// align="center" suits one-row alerts with buttons; the default keeps the icon on the first line of longer text.
export function Alert({ tone = "danger", align = "start", className, children }) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex gap-3 rounded-lg border border-l-[3px] border-surface-0-border bg-surface-0 p-3 text-[14px] text-text",
        align === "center" ? "items-center" : "items-start",
        TONES[tone],
        className,
      )}
    >
      <Icon
        name="warning"
        size={18}
        className={cn("shrink-0", align === "start" && "mt-0.5", ICON_TONES[tone])}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
