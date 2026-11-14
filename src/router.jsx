import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { AuthLayout } from "./components/layout/AuthLayout.jsx";
import { RouteError } from "./components/layout/RouteError.jsx";
import { RedirectIfAuthenticated, RequireAuth } from "./routes/guards.jsx";

// Each page loads on demand, so the first visit only downloads the screen it shows.
const page = (load, name) => () => load().then((module) => ({ Component: module[name] }));

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/month" replace /> },
      {
        element: <RedirectIfAuthenticated />,
        children: [
          {
            path: "auth",
            element: <AuthLayout />,
            children: [
              { index: true, element: <Navigate to="login" replace /> },
              {
                path: "login",
                lazy: page(() => import("./pages/auth/LoginPage.jsx"), "LoginPage"),
              },
              {
                path: "signup",
                lazy: page(() => import("./pages/auth/SignupPage.jsx"), "SignupPage"),
              },
              {
                path: "forgot-password",
                lazy: page(
                  () => import("./pages/auth/ForgotPasswordPage.jsx"),
                  "ForgotPasswordPage",
                ),
              },
            ],
          },
        ],
      },
      // Email links open in any browser, signed in or out, so these two skip RedirectIfAuthenticated.
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          {
            path: "reset-password",
            lazy: page(() => import("./pages/auth/ResetPasswordPage.jsx"), "ResetPasswordPage"),
          },
          {
            path: "verify-email",
            lazy: page(() => import("./pages/auth/VerifyEmailPage.jsx"), "VerifyEmailPage"),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          // First-run setup is full-page (no navigation shell); RequireAuth sends unfinished users here.
          { path: "setup", lazy: page(() => import("./pages/SetupPage.jsx"), "SetupPage") },
          {
            element: <AppLayout />,
            children: [
              { path: "month", lazy: page(() => import("./pages/MonthPage.jsx"), "MonthPage") },
              { path: "daily", lazy: page(() => import("./pages/DailyPage.jsx"), "DailyPage") },
              { path: "stats", lazy: page(() => import("./pages/StatsPage.jsx"), "StatsPage") },
              {
                path: "accounts",
                lazy: page(() => import("./pages/AccountsPage.jsx"), "AccountsPage"),
              },
              { path: "search", lazy: page(() => import("./pages/SearchPage.jsx"), "SearchPage") },
              { path: "lists", lazy: page(() => import("./pages/ListsPage.jsx"), "ListsPage") },
              {
                path: "settings",
                lazy: page(() => import("./pages/SettingsPage.jsx"), "SettingsPage"),
              },
              {
                path: "add",
                lazy: page(() => import("./pages/AddTransactionPage.jsx"), "AddTransactionPage"),
              },
              {
                path: "tx/:id",
                lazy: page(() => import("./pages/TransactionPage.jsx"), "TransactionPage"),
              },
              {
                path: "tx/:id/edit",
                lazy: page(() => import("./pages/AddTransactionPage.jsx"), "AddTransactionPage"),
              },
            ],
          },
        ],
      },
      { path: "*", lazy: page(() => import("./pages/NotFoundPage.jsx"), "NotFoundPage") },
    ],
  },
]);
