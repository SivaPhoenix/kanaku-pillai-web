import { use } from "react";
import { ToastContext } from "../context/toast-context.js";

export function useToast() {
  const value = use(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
}
