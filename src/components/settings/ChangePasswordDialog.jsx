import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { authApi } from "../../lib/auth-api.js";
import { changePasswordSchema } from "../../schemas/auth.js";
import { Alert, Button, Dialog, PasswordInput, StrengthMeter } from "../ui/index.js";

const EMPTY = { currentPassword: "", password: "", confirmPassword: "" };

// Settings → Change password (accounts that have one). This device stays signed in; the API ends the others.
export function ChangePasswordDialog({ open, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState(null);
  const [sendingLink, setSendingLink] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });
  const password = useWatch({ control, name: "password" });

  function close() {
    reset(EMPTY);
    setFormError(null);
    onClose();
  }

  // The signed-out forgot-password page is not reachable while signed in, so the reset link is requested from here.
  async function sendResetLink() {
    setSendingLink(true);
    setFormError(null);
    try {
      await authApi.requestPasswordReset(user.email);
    } catch (error) {
      setFormError(error?.message ?? "Couldn't send the link. Try again.");
      setSendingLink(false);
      return;
    }
    setSendingLink(false);
    toast.show({ message: `We sent a reset link to ${user.email}. It expires in 30 minutes.` });
    close();
  }

  function handleError(error) {
    if (error instanceof ApiError) {
      if (error.code === "INVALID_CREDENTIALS") {
        setError("currentPassword", { message: "Current password is incorrect" });
        return;
      }
      if (error.code === "VALIDATION_ERROR") {
        const message = fieldErrors(error).newPassword;
        if (message) {
          setError("password", { message });
          return;
        }
      }
      if (error.status === 429) {
        setFormError("Too many attempts. Wait a few minutes and try again.");
        return;
      }
    }
    setFormError(error?.message ?? "Couldn't change the password. Try again.");
  }

  async function onSubmit({ currentPassword, password: newPassword }) {
    setFormError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
    } catch (error) {
      handleError(error);
      return;
    }
    toast.show({ message: "Password changed. Other devices were signed out." });
    close();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Change password"
      size="sm"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" fullWidth loading={isSubmitting}>
            Update password
          </Button>
        </>
      }
    >
      <form
        id="change-password-form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 pt-2"
      >
        {formError ? <Alert>{formError}</Alert> : null}
        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <Button
            variant="ghost"
            loading={sendingLink}
            onClick={sendResetLink}
            className="h-11 self-start px-0 text-[14px]"
          >
            Forgot your current password?
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <StrengthMeter password={password} />
        </div>
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <p className="text-[13px] text-text-muted">Other devices will be signed out.</p>
      </form>
    </Dialog>
  );
}
