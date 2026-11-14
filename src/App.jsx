import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { useState } from "react";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { ToastProvider } from "./context/ToastProvider.jsx";
import { config } from "./lib/config.js";
import { createQueryClient } from "./lib/query-client.js";
import { router } from "./router.jsx";

// Google's script is only loaded when a client ID is configured; without one the Google button is hidden.
function MaybeGoogleProvider({ children }) {
  if (!config.googleClientId) return children;
  return <GoogleOAuthProvider clientId={config.googleClientId}>{children}</GoogleOAuthProvider>;
}

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <MaybeGoogleProvider>
            <AuthProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </AuthProvider>
          </MaybeGoogleProvider>
        </QueryClientProvider>
      </ThemeProvider>
      {/* Vercel Web Analytics: page views only (no cookies); route changes are picked up from history. */}
      <Analytics />
    </>
  );
}
