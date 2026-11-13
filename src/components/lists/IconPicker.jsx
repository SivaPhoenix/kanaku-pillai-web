import { cn } from "../../lib/cn.js";
import { CATEGORY_ICON_NAMES } from "../../lib/icons.js";
import { Icon } from "../ui/index.js";

// The allowed icon names as a grid of 44px buttons.
export function IconPicker({ value, onChange, "aria-label": ariaLabel = "Icon" }) {
  return (
    <div role="group" aria-label={ariaLabel} className="grid grid-cols-5 gap-2 tablet:grid-cols-8">
      {CATEGORY_ICON_NAMES.map((name) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={selected}
            onClick={() => onChange(name)}
            className={cn(
              "grid size-11 place-items-center rounded-md text-text",
              selected
                ? "border-[1.5px] border-primary bg-primary/18"
                : "border border-surface-0-border bg-surface-0",
            )}
          >
            <Icon name={name} size={20} />
          </button>
        );
      })}
    </div>
  );
}
