import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn.js";
import { ToastContext } from "./toast-context.js";

const DEFAULT_DURATION = 5000;
let nextId = 0;

// One toast at a time (spec §4 "Deleted · Undo"); it sits above the phone tab bar and in the corner on larger screens.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(({ message, tone = "neutral", action, duration = DEFAULT_DURATION }) => {
    clearTimeout(timer.current);
    nextId += 1;
    setToast({ id: nextId, message, tone, action });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-28 z-50 flex justify-center tablet:inset-x-auto tablet:right-6 tablet:bottom-6"
      >
        {toast ? (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex min-h-12 w-full max-w-md animate-fade-scale items-center gap-3 rounded-xl surface-l2 px-4 py-2",
              toast.tone === "danger" && "border-danger",
            )}
          >
            <p className="min-w-0 flex-1 text-[15px] font-medium text-text">{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  dismiss();
                }}
                className="min-h-11 shrink-0 rounded-md px-3 text-[15px] font-bold text-link"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext>
  );
}
