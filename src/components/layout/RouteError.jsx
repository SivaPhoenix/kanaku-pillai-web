import { useEffect, useState } from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import {
  canReloadForStaleBuild,
  isChunkLoadError,
  reloadOnceForStaleBuild,
} from "../../lib/stale-build.js";
import { Button, Spinner } from "../ui/index.js";

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  // A page chunk from an older deploy: reload once into the new build instead of showing an error.
  // Decided once on mount; the 30-second guard means a real error is shown rather than reloading in a loop.
  const [reloading] = useState(() => isChunkLoadError(error) && canReloadForStaleBuild());

  useEffect(() => {
    if (reloading) reloadOnceForStaleBuild();
  }, [reloading]);

  if (reloading) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center text-text-muted">
        <Spinner />
      </main>
    );
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-3 px-5 text-center"
    >
      <h1 className="text-[22px] font-bold text-text">
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="text-[15px] text-text-muted">
        {notFound
          ? "That page does not exist."
          : "We could not show this page. Try again, or go back to your month."}
      </p>
      <div className="mt-4 flex flex-col items-center gap-3 tablet:flex-row">
        <Button as={Link} to="/month">
          Go to Month
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </main>
  );
}
