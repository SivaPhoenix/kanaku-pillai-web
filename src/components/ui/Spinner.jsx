import { cn } from "../../lib/cn.js";

export function Spinner({ className }) {
  return (
    <span role="status" className={cn("inline-flex", className)}>
      <span
        aria-hidden="true"
        className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="sr-only">Loading</span>
    </span>
  );
}
