import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";

const SETUP_PATH = "/setup";

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center text-text-muted">
      <Spinner />
    </div>
  );
}

// Signed-out visitors go to login and come back afterwards. Signed-in users who haven't finished first-run setup
// (no accounts or categories yet) are sent to /setup before anything else.
export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  if (user && !user.setupComplete && location.pathname !== SETUP_PATH) {
    return <Navigate to={SETUP_PATH} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "authenticated") {
    const target = location.state?.from?.pathname ?? "/month";
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
