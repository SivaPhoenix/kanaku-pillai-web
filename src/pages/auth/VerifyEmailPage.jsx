import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Alert, Button, Spinner } from "../../components/ui/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useFragmentToken } from "../../hooks/useFragmentToken.js";
import { useToast } from "../../hooks/useToast.js";
import { ApiError } from "../../lib/api.js";
import { authApi } from "../../lib/auth-api.js";

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

export function VerifyEmailPage() {
  const { status, user, refreshUser } = useAuth();
  const toast = useToast();
  const token = useFragmentToken();
  const [phase, setPhase] = useState(token ? "verifying" : "invalid");
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState(null);
  const started = useRef(false);
  const signedIn = status === "authenticated";

  useEffect(() => {
    // A ref so StrictMode's effect replay can't spend the one-time link twice.
    if (started.current || !token) return;
    started.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setPhase("verified"))
      .catch((error) => {
        setPhase(error instanceof ApiError && error.code === "INVALID_LINK" ? "invalid" : "error");
      });
  }, [token]);

  const needsRefresh = phase === "verified" && signedIn && user?.emailVerified === false;
  useEffect(() => {
    if (needsRefresh) refreshUser().catch(() => {});
  }, [needsRefresh, refreshUser]);

  async function resend() {
    setResending(true);
    setResendError(null);
    try {
      await authApi.resendVerificationEmail();
      toast.show({ message: "Verification email sent. Check your inbox." });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_VERIFIED") {
        await refreshUser().catch(() => {});
        setPhase("verified");
      } else {
        setResendError(error?.message ?? "Something went wrong. Try again.");
      }
    } finally {
      setResending(false);
    }
  }

  if (phase === "verifying") {
    return (
      <div className="grid min-h-40 place-items-center text-text-muted">
        <Spinner />
      </div>
    );
  }

  if (phase === "verified") {
    return (
      <div className="flex flex-col gap-6">
        <Heading>Email verified</Heading>
        <Panel>
          <p className="text-[15px] text-text">
            Thanks. Your email address is confirmed and your account is more secure.
          </p>
          <Button as={Link} to={signedIn ? "/month" : "/auth/login"} fullWidth>
            {signedIn ? "Continue" : "Sign in"}
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
          <Alert>
            We couldn't verify your email. Check your connection and open the link again.
          </Alert>
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading>This link has expired</Heading>
      <Panel>
        {resendError ? <Alert>{resendError}</Alert> : null}
        {signedIn ? (
          <>
            <p className="text-[15px] text-text">
              Verification links work once and expire after a while. We can send you a new one.
            </p>
            <Button fullWidth loading={resending} onClick={resend}>
              Send a new link
            </Button>
          </>
        ) : (
          <>
            <p className="text-[15px] text-text">
              Verification links work once and expire after a while. Sign in, then resend the email
              from Settings.
            </p>
            <Button as={Link} to="/auth/login" fullWidth>
              Sign in
            </Button>
          </>
        )}
      </Panel>
    </div>
  );
}
