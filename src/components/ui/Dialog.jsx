import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn.js";
import { IconButton } from "./IconButton.jsx";

const SIZES = {
  sm: "tablet:max-w-[460px]",
  md: "tablet:max-w-[560px]",
  lg: "tablet:max-w-[720px]",
};

// Bottom sheet on phones, centred modal from tablet up (spec §4). Built on <dialog>: focus is trapped and Esc closes it.
export function Dialog({ open, onClose, title, children, footer, size = "md", className }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none animate-sheet-up overflow-hidden rounded-t-sheet surface-l2 p-0 text-text backdrop:bg-scrim",
        "tablet:m-auto tablet:max-h-[86dvh] tablet:animate-fade-scale tablet:rounded-sheet",
        SIZES[size],
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[inherit] flex-col">
          <div
            className="mx-auto mt-2 h-1.25 w-10 rounded-full bg-line tablet:hidden"
            aria-hidden="true"
          />
          <header className="flex items-center gap-3 px-5 pt-3 pb-2 tablet:px-6 tablet:pt-5">
            <h2 className="min-w-0 flex-1 text-[17px] font-bold">{title}</h2>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 tablet:px-6">{children}</div>
          {footer ? (
            <footer className="flex gap-3 border-t border-line px-5 py-4 tablet:px-6">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
