import { useState } from "react";
import { ApiError } from "../lib/api.js";
import { authApi } from "../lib/auth-api.js";
import { useAuth } from "./useAuth.js";
import { useToast } from "./useToast.js";

// Resends the verification email. A 409 means the account was verified elsewhere, so the user is refetched instead.
export function useResendVerification() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await authApi.resendVerificationEmail();
      toast.show({ message: "Verification email sent. Check your inbox." });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_VERIFIED") {
        await refreshUser().catch(() => {});
      } else {
        toast.show({
          message: error?.message ?? "Couldn't send the email. Try again.",
          tone: "danger",
        });
      }
    } finally {
      setSending(false);
    }
  }

  return { resend, sending };
}
