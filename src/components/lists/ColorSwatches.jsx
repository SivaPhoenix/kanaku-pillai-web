import { cn } from "../../lib/cn.js";

const SWATCH = {
  c1: "bg-c1",
  c2: "bg-c2",
  c3: "bg-c3",
  c4: "bg-c4",
  c5: "bg-c5",
  c6: "bg-c6",
  c7: "bg-c7",
};

// Palette slots c1-c7 as 44px targets; the selected one carries a ring.
export function ColorSwatches({ value, onChange, "aria-label": ariaLabel = "Colour" }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {Object.entries(SWATCH).map(([name, bg]) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            aria-label={name.toUpperCase()}
            aria-pressed={selected}
            onClick={() => onChange(name)}
            className="grid size-11 place-items-center rounded-full"
          >
            <span
              className={cn(
                "size-8 rounded-full",
                bg,
                selected && "ring-[2.5px] ring-text ring-offset-2 ring-offset-bg",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
