import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton.jsx";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Input,
  PasswordInput,
} from "../../components/ui/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { loginSchema } from "../../schemas/auth.js";

const FIELDS = ["email", "password"];

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", keepSignedIn: true },
  });

  const destination = location.state?.from?.pathname ?? "/month";

  function handleError(error) {
    if (error instanceof ApiError) {
      if (error.code === "INVALID_CREDENTIALS") {
        setFormError("Email or password is incorrect");
        return;
      }
      if (error.code === "VALIDATION_ERROR") {
        const entries = Object.entries(fieldErrors(error)).filter(([name]) =>
          FIELDS.includes(name),
        );
        if (entries.length > 0) {
          entries.forEach(([name, message]) => setError(name, { message }));
          return;
        }
      }
    }
    setFormError(error?.message ?? "Something went wrong. Try again.");
  }

  async function onSubmit(values) {
    setFormError(null);
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      handleError(error);
    }
  }

  async function onGoogle(credential) {
    setFormError(null);
    try {
      await loginWithGoogle(credential);
      navigate(destination, { replace: true });
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-[22px] font-bold text-text desktop:text-[26px]">Welcome back</h1>
        <p className="text-[15px] text-text-muted">Sign in to Kanaku Pillai</p>
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
          <div className="flex flex-col gap-1">
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Link
              to="/auth/forgot-password"
              className="inline-flex min-h-11 items-center self-end text-[14px] font-semibold text-link"
            >
              Forgot password?
            </Link>
          </div>
          <Checkbox className="hidden tablet:flex" {...register("keepSignedIn")}>
            Keep me signed in
          </Checkbox>
          <Button type="submit" fullWidth loading={isSubmitting}>
            Sign in
          </Button>
        </form>
        <Divider label="or" />
        <GoogleSignInButton onCredential={onGoogle} onError={() => handleError(null)} />
      </div>

      <p className="text-center text-[15px] text-text-muted">
        New here?{" "}
        <Link to="/auth/signup" className="inline-flex min-h-11 items-center font-bold text-link">
          Create an account
        </Link>
      </p>
    </div>
  );
}
