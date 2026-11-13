import { cn } from "../../lib/cn.js";

export function Checkbox({ ref, children, className, ...rest }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3", className)}>
      <input ref={ref} type="checkbox" className="size-5 shrink-0 accent-primary" {...rest} />
      <span className="text-[15px] text-text">{children}</span>
    </label>
  );
}
