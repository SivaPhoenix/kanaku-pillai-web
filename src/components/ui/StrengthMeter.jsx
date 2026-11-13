import { cn } from "../../lib/cn.js";
import { scorePassword, STRENGTH_LABELS } from "../../lib/password-strength.js";

const FILL = ["", "bg-danger", "bg-expense", "bg-warning", "bg-success"];

export function StrengthMeter({ score, password = "", className }) {
  const value = score ?? scorePassword(password);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn("h-1.5 flex-1 rounded-full", n <= value ? FILL[value] : "bg-line")}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-[13px] text-text-muted-2">
        {STRENGTH_LABELS[value]}
      </p>
    </div>
  );
}
