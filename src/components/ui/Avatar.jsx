import { cn } from "../../lib/cn.js";

const SIZES = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-14 text-xl",
};

export function Avatar({ name = "", src, size = "md", decorative = false, className }) {
  const base = cn("shrink-0 rounded-full", SIZES[size], className);
  if (src) {
    return (
      <img
        src={src}
        alt={decorative ? "" : name}
        aria-hidden={decorative || undefined}
        className={cn(base, "object-cover")}
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        base,
        "inline-flex items-center justify-center surface-l0 font-semibold text-text",
      )}
    >
      <span aria-hidden="true">{initial}</span>
    </span>
  );
}
