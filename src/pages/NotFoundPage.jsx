import { Link } from "react-router";
import { Button } from "../components/ui/index.js";

export function NotFoundPage() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-3 px-5 text-center"
    >
      <h1 className="text-[22px] font-bold text-text">Page not found</h1>
      <p className="text-[15px] text-text-muted">That page does not exist.</p>
      <Button as={Link} to="/month" className="mt-4">
        Go to Month
      </Button>
    </main>
  );
}
