import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Alert, Button, Input } from "../../components/ui/index.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { authApi } from "../../lib/auth-api.js";
import { forgotPasswordSchema } from "../../schemas/auth.js";

const RESEND_SECONDS = 60;

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

const countdownLabel = (seconds) => `0:${String(seconds).padStart(2, "0")}`;

function BackToSignIn() {
  return (
    <p className="text-center text-[15px] text-text-muted">
      Remembered it?{" "}
      <Link to="/auth/login" className="inline-flex min-h-11 items-center font-bold text-link">
        Back to sign in
      </Link>
    </p>
  );
}

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null);
  const [formError, setFormError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function handleError(error) {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      const message = fieldErrors(error).email;
      if (message) {
        setError("email", { message });
        return;
      }
    }
    setFormError(error?.message ?? "Something went wrong. Try again.");
  }

  async function send(email) {
    await authApi.requestPasswordReset(email);
    setSentTo(email);
    setSecondsLeft(RESEND_SECONDS);
  }

  async function onSubmit({ email }) {
    setFormError(null);
    try {
      await send(email);
    } catch (error) {
      handleError(error);
    }
  }

  async function onResend() {
    setFormError(null);
    setResending(true);
    try {
      await send(sentTo);
    } catch (error) {
      setFormError(error?.message ?? "Something went wrong. Try again.");
    } finally {
      setResending(false);
    }
  }

  function useDifferentEmail() {
    setSentTo(null);
    setFormError(null);
    setSecondsLeft(0);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-center text-[22px] font-bold text-text desktop:text-[26px]">
          Check your email
        </h1>

        <div className="flex flex-col gap-4 rounded-sheet surface-l2 p-5 tablet:p-6">
          {formError ? <Alert>{formError}</Alert> : null}
          <p className="text-[15px] text-text">
            If an account exists for{" "}
            <span className="font-semibold break-all">{maskEmail(sentTo)}</span>, we sent a link to
            reset your password. The link expires in 30 minutes. Check your spam folder if you don't
            see it.
          </p>
          <div className="flex flex-col items-start gap-1 tablet:flex-row tablet:items-center tablet:gap-4">
            {secondsLeft > 0 ? (
              <span className="inline-flex min-h-11 items-center text-[15px] text-text-muted tabular">
                Resend in {countdownLabel(secondsLeft)}
              </span>
            ) : (
              <Button variant="ghost" loading={resending} onClick={onResend} className="px-0">
                Resend
              </Button>
            )}
            <Button variant="ghost" onClick={useDifferentEmail} className="px-0">
              Use a different email
            </Button>
          </div>
        </div>

        <BackToSignIn />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-[22px] font-bold text-text desktop:text-[26px]">Reset your password</h1>
        <p className="text-[15px] text-text-muted">
          Enter your email and we will send you a link to choose a new one.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-sheet surface-l2 p-5 tablet:p-6">
        {formError ? <Alert>{formError}</Alert> : null}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
        <p className="text-[13px] text-text-muted">
          For privacy we show the same message whether or not the email has an account.
        </p>
      </div>

      <BackToSignIn />
    </div>
  );
}
