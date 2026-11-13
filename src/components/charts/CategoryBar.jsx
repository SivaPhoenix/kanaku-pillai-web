import { cn } from "../../lib/cn.js";
import { BG_TONE } from "./tones.js";

// Stacked horizontal bar of category shares; decorative, the rows beside it carry the numbers.
export function CategoryBar({ segments, className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-line", className)}
    >
      {segments
        .filter((s) => s.pct > 0)
        .map((s) => (
          <span
            key={s.id}
            className={cn("h-full", BG_TONE[s.tone] ?? "bg-text-muted")}
            style={{ width: `${s.pct}%` }}
          />
        ))}
    </div>
  );
}
