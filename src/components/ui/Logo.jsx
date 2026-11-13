import { cn } from "../../lib/cn.js";

const SIZES = {
  sm: "size-8 text-lg",
  md: "size-10 text-2xl",
  lg: "size-14 text-3xl",
};

export function Logo({ size = "md", withWordmark = false, className }) {
  return (
    <span
      role="img"
      aria-label="Kanaku Pillai"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-primary font-tamil text-on-primary",
          SIZES[size],
        )}
      >
        {"க"}
      </span>
      {withWordmark ? (
        <span aria-hidden="true" className="font-semibold text-text">
          Kanaku Pillai
        </span>
      ) : null}
    </span>
  );
}
