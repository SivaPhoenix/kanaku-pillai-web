import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center text-text-muted">
      <Spinner />
    </div>
  );
}

// Signed-out visitors go to login and come back to the page they asked for afterwards.
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
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
