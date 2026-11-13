import { cn } from "../../lib/cn.js";

export function Divider({ label, className }) {
  if (!label) return <hr className={cn("h-px border-0 bg-line", className)} />;
  return (
    <div role="separator" className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
