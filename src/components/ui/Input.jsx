import { useId } from "react";
import { cn } from "../../lib/cn.js";

export function Input({
  ref,
  id,
  label,
  error,
  hint,
  trailing,
  className,
  inputClassName,
  ...rest
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-text-muted-2">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-[50px] w-full rounded-lg surface-l0 px-4 text-[15px] text-text tablet:h-[52px] large:h-[54px]",
            "placeholder:text-text-muted aria-invalid:border-danger",
            trailing && "pr-12",
            inputClassName,
          )}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-[13px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
