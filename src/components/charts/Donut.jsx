import { cn } from "../../lib/cn.js";
import { arcPath, donutSegments } from "./chart-math.js";
import { STROKE_TONE } from "./tones.js";

const pctText = (pct) => `${Math.round(pct * 10) / 10}%`;

// segments: [{ id, label, tone, amountMinor, pct }] sorted by the caller; centre text sits inside the ring.
export function Donut({ segments, title = "Breakdown", centreLabel, centreValue, className }) {
  const arcs = donutSegments(segments);
  const description = segments.length
    ? `${title}: ${segments.map((s) => `${s.label} ${pctText(s.pct)}`).join(", ")}`
    : `${title}: no data`;
  return (
    <div className={cn("relative size-55 shrink-0 desktop:size-67.5 large:size-82.5", className)}>
      <svg viewBox="0 0 100 100" role="img" aria-label={description} className="size-full">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" className="stroke-line" />
        {arcs.map((arc) => (
          <path
            key={arc.id}
            d={arcPath({ from: arc.from, to: arc.to })}
            fill="none"
            strokeWidth="12"
            className={STROKE_TONE[arc.tone] ?? "stroke-text-muted"}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
        <span className="text-[13px] font-semibold text-text-muted-2">{centreLabel}</span>
        <span className="max-w-full font-mono text-[20px] font-semibold text-text tabular desktop:text-[24px]">
          {centreValue}
        </span>
      </div>
    </div>
  );
}
