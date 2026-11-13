import { cn } from "../../lib/cn.js";
import { TONE_TILE } from "../../lib/transaction-display.js";
import { Icon } from "../ui/Icon.jsx";

// Icon in a tinted rounded square (spec §2.4 icon tile); tone is a palette slot c1–c7 or "transfer".
export function IconTile({ icon, tone, size = "md", className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-md",
        size === "lg" ? "size-16" : "size-10 tablet:size-11",
        TONE_TILE[tone] ?? TONE_TILE.transfer,
        className,
      )}
    >
      <Icon name={icon} size={size === "lg" ? 28 : 20} />
    </span>
  );
}
