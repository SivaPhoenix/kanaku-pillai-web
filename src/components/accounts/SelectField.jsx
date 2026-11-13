import { useId } from "react";
import { cn } from "../../lib/cn.js";

// Labelled native select styled like Input.
export function SelectField({ ref, id, label, error, className, children, ...rest }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={selectId} className="text-[13px] font-semibold text-text-muted-2">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className="h-[50px] w-full rounded-lg surface-l0 px-3 text-[15px] text-text aria-invalid:border-danger tablet:h-[52px]"
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
