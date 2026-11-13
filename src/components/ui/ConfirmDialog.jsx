import { Button } from "./Button.jsx";
import { Dialog } from "./Dialog.jsx";

// Destructive confirmation (spec §4 Alert dialog): title, one-line consequence, Cancel + a solid danger action.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  children,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger-solid" fullWidth loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="text-[15px] text-text-muted">{description}</p> : null}
      {children}
    </Dialog>
  );
}
