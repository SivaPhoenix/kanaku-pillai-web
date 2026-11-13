import { cn } from "../../lib/cn.js";

export function EmptyState({ title, description, action, secondaryAction, className }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-6 py-12 text-center", className)}>
      <h2 className="text-lg font-bold text-text">{title}</h2>
      {description ? <p className="text-[15px] text-text-muted">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-col items-center gap-3 tablet:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
