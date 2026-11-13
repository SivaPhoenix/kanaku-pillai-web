import { useRef } from "react";
import { cn } from "../../lib/cn.js";

const SELECTED = {
  solid: "bg-primary font-bold text-on-primary",
  tint: "bg-primary/20 font-bold text-text",
};

export function Segmented({
  options,
  value,
  onChange,
  variant = "solid",
  "aria-label": ariaLabel,
  className,
}) {
  const groupRef = useRef(null);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  function handleKeyDown(event) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !backward) return;
    event.preventDefault();
    const next = (tabbableIndex + (forward ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    groupRef.current?.querySelectorAll('[role="radio"]')[next]?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn("flex gap-1 rounded-xl surface-l0 p-1", className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-10 flex-1 rounded-lg px-3 text-[14px] font-semibold",
              selected ? SELECTED[variant] : "text-text-muted-2",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
