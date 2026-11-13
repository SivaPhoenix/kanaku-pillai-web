import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api.js";

// Client errors (4xx) are final; only network and server failures are worth retrying.
function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
}
