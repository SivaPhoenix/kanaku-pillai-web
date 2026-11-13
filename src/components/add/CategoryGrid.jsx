import { Link } from "react-router";
import { cn } from "../../lib/cn.js";
import { IconTile } from "../transaction/IconTile.jsx";
import { Icon } from "../ui/index.js";

// Static classes per palette slot, so Tailwind can see every one.
const SELECTED = {
  c1: "border-[1.5px] border-c1 bg-c1/18",
  c2: "border-[1.5px] border-c2 bg-c2/18",
  c3: "border-[1.5px] border-c3 bg-c3/18",
  c4: "border-[1.5px] border-c4 bg-c4/18",
  c5: "border-[1.5px] border-c5 bg-c5/18",
  c6: "border-[1.5px] border-c6 bg-c6/18",
  c7: "border-[1.5px] border-c7 bg-c7/18",
};

export function CategoryGrid({ kind, categories, value, onChange, error }) {
  return (
    <section aria-label="Category" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text-muted-2">CATEGORY</h2>
        <Link
          to={`/lists?tab=${kind}`}
          aria-label="Edit categories"
          className="inline-flex size-11 items-center justify-center rounded-lg text-link"
        >
          <Icon name="edit" size={18} />
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="text-[14px] text-text-muted">No {kind} categories yet. Add one in Lists.</p>
      ) : (
        <div
          role="radiogroup"
          aria-label="Category"
          className="grid grid-cols-3 gap-2 tablet:grid-cols-4"
        >
          {categories.map((category) => {
            const selected = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(category.id)}
                className={cn(
                  "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[13px] text-text",
                  selected
                    ? cn("font-bold", SELECTED[category.color] ?? SELECTED.c3)
                    : "border border-surface-0-border bg-surface-0 font-medium",
                )}
              >
                <IconTile icon={category.icon} tone={category.color} />
                <span className="w-full truncate text-center">{category.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </section>
  );
}
