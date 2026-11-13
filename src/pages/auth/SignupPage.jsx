import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton.jsx";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  IconButton,
  Input,
  PasswordInput,
  StrengthMeter,
} from "../../components/ui/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { signupSchema } from "../../schemas/auth.js";

const FIELDS = ["name", "email", "password"];

function DisabledLink({ children }) {
  return (
    <a
      href="#"
      aria-disabled="true"
      title="Coming soon"
      onClick={(event) => event.preventDefault()}
      className="font-bold text-link"
    >
      {children}
    </a>
  );
}

export function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const password = useWatch({ control, name: "password" });

  function handleError(error) {
    if (error instanceof ApiError) {
      if (error.code === "EMAIL_TAKEN") {
        setError("email", { message: error.message });
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

  async function onSubmit({ name, email, password }) {
    setFormError(null);
    try {
      await signup({ name, email, password });
      navigate("/month", { replace: true });
    } catch (error) {
      handleError(error);
    }
  }

  async function onGoogle(credential) {
    setFormError(null);
    try {
      await loginWithGoogle(credential);
      navigate("/month", { replace: true });
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton as={Link} to="/auth/login" icon="back" label="Back to sign in" />
        <h1 className="text-[22px] font-bold text-text desktop:text-[26px]">Create your account</h1>
      </div>

      <div className="flex flex-col gap-4 rounded-sheet surface-l2 p-5 tablet:p-6">
        {formError ? <Alert>{formError}</Alert> : null}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-4 tablet:grid-cols-2">
            <Input
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <div className="grid gap-4 tablet:grid-cols-2">
            <div className="flex flex-col gap-2">
              <PasswordInput
                label="Password"
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
          </div>
          <div className="flex flex-col gap-1">
            <Checkbox
              aria-label="I agree to the Terms and Privacy Policy"
              aria-invalid={errors.acceptTerms ? true : undefined}
              {...register("acceptTerms")}
            >
              I agree to the <DisabledLink>Terms</DisabledLink> and{" "}
              <DisabledLink>Privacy Policy</DisabledLink>
            </Checkbox>
            {errors.acceptTerms ? (
              <p className="text-[13px] text-danger">{errors.acceptTerms.message}</p>
            ) : null}
          </div>
          <Button type="submit" fullWidth loading={isSubmitting}>
            Create account
          </Button>
        </form>
        <Divider label="or" />
        <GoogleSignInButton onCredential={onGoogle} onError={() => handleError(null)} />
      </div>

      <p className="text-center text-[15px] text-text-muted">
        Already have an account?{" "}
        <Link to="/auth/login" className="inline-flex min-h-11 items-center font-bold text-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
