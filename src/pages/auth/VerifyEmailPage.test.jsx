import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthContext } from "../../context/auth-context.js";
import { ToastContext } from "../../context/toast-context.js";
import { ApiError } from "../../lib/api.js";

vi.mock("../../lib/auth-api.js", () => ({
  authApi: { verifyEmail: vi.fn(), resendVerificationEmail: vi.fn() },
}));
const { authApi } = await import("../../lib/auth-api.js");
const { VerifyEmailPage } = await import("./VerifyEmailPage.jsx");

const signedOut = { status: "unauthenticated", user: null, refreshUser: vi.fn() };
const expired = () => new ApiError({ status: 400, code: "INVALID_LINK", message: "expired" });

function renderPage(auth = signedOut) {
  window.location.hash = "#token=xyz";
  return render(
    <StrictMode>
      <AuthContext value={auth}>
        <ToastContext value={{ show: vi.fn(), dismiss: vi.fn() }}>
          <MemoryRouter>
            <VerifyEmailPage />
          </MemoryRouter>
        </ToastContext>
      </AuthContext>
    </StrictMode>,
  );
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    authApi.verifyEmail.mockReset();
    authApi.resendVerificationEmail.mockReset();
  });

  it("verifies once under StrictMode and offers sign in when signed out", async () => {
    authApi.verifyEmail.mockResolvedValue({ emailVerified: true });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Email verified" })).toBeVisible();
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
    expect(authApi.verifyEmail).toHaveBeenCalledWith("xyz");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");
    expect(window.location.hash).toBe("");
  });

  it("continues to the app and refreshes the user when signed in", async () => {
    authApi.verifyEmail.mockResolvedValue({ emailVerified: true });
    const refreshUser = vi.fn().mockResolvedValue({});
    renderPage({
      status: "authenticated",
      user: { id: "u1", emailVerified: false },
      refreshUser,
    });
    expect(await screen.findByRole("link", { name: "Continue" })).toHaveAttribute("href", "/month");
    await vi.waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });

  it("shows the expired state and a resend button when signed in", async () => {
    authApi.verifyEmail.mockRejectedValue(expired());
    renderPage({ status: "authenticated", user: { id: "u1" }, refreshUser: vi.fn() });
    expect(await screen.findByRole("heading", { name: "This link has expired" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Send a new link" })).toBeVisible();
  });

  it("tells signed-out users to sign in when the link is expired", async () => {
    authApi.verifyEmail.mockRejectedValue(expired());
    renderPage();
    expect(await screen.findByRole("heading", { name: "This link has expired" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Send a new link" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
