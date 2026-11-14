import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Alert, Button, PasswordInput, Spinner, StrengthMeter } from "../../components/ui/index.js";
import { useFragmentToken } from "../../hooks/useFragmentToken.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { authApi } from "../../lib/auth-api.js";
import { notifySignedOut } from "../../lib/session.js";
import { resetPasswordSchema } from "../../schemas/auth.js";

function Heading({ children }) {
  return (
    <h1 className="text-center text-[22px] font-bold text-text desktop:text-[26px]">{children}</h1>
  );
}

function Panel({ children }) {
  return (
    <div className="flex flex-col gap-4 rounded-sheet surface-l2 p-5 tablet:p-6">{children}</div>
  );
}

function ResetForm({ token, onInvalid, onDone }) {
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  function handleError(error) {
    if (error instanceof ApiError) {
      if (error.code === "INVALID_LINK") {
        onInvalid();
        return;
      }
      if (error.code === "VALIDATION_ERROR") {
        const message = fieldErrors(error).password;
        if (message) {
          setError("password", { message });
          return;
        }
      }
    }
    setFormError(error?.message ?? "Something went wrong. Try again.");
  }

  async function onSubmit({ password }) {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, password });
      onDone();
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading>Choose a new password</Heading>
      <Panel>
        {formError ? <Alert>{formError}</Alert> : null}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            label="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Reset password
          </Button>
        </form>
      </Panel>
    </div>
  );
}

export function ResetPasswordPage() {
  const token = useFragmentToken();
  const [phase, setPhase] = useState(token ? "checking" : "invalid");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authApi
      .checkResetToken(token)
      .then(() => !cancelled && setPhase("form"))
      .catch((error) => {
        if (cancelled) return;
        setPhase(error instanceof ApiError && error.code === "INVALID_LINK" ? "invalid" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  function retry() {
    setPhase("checking");
    setAttempt((n) => n + 1);
  }

  // The server has revoked every session of this user, including this browser's, so drop the local state too.
  function onDone() {
    notifySignedOut();
    setPhase("done");
  }

  if (phase === "checking") {
    return (
      <div className="grid min-h-40 place-items-center text-text-muted">
        <Spinner />
      </div>
    );
  }

  if (phase === "form") {
    return <ResetForm token={token} onInvalid={() => setPhase("invalid")} onDone={onDone} />;
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-6">
        <Heading>Password changed</Heading>
        <Panel>
          <p className="text-[15px] text-text">
            You've been signed out on every device. Sign in with your new password.
          </p>
          <Button as={Link} to="/auth/login" fullWidth>
            Sign in
          </Button>
        </Panel>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-6">
        <Heading>Something went wrong</Heading>
        <Panel>
          <Alert>We couldn't check this link. Check your connection and try again.</Alert>
          <Button fullWidth onClick={retry}>
            Try again
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading>This link has expired</Heading>
      <Panel>
        <p className="text-[15px] text-text">
          Reset links work once and expire after 30 minutes. Request a new one to continue.
        </p>
        <Button as={Link} to="/auth/forgot-password" fullWidth>
          Request a new link
        </Button>
      </Panel>
    </div>
  );
}
