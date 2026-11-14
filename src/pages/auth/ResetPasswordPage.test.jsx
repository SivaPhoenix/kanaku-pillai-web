import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ApiError } from "../../lib/api.js";

vi.mock("../../lib/auth-api.js", () => ({
  authApi: { checkResetToken: vi.fn(), resetPassword: vi.fn() },
}));
const { authApi } = await import("../../lib/auth-api.js");
const session = await import("../../lib/session.js");
const { ResetPasswordPage } = await import("./ResetPasswordPage.jsx");

const invalid = () => new ApiError({ status: 400, code: "INVALID_LINK", message: "expired" });

function renderPage(hash = "#token=abc") {
  window.location.hash = hash;
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(password, confirm) {
  await userEvent.type(await screen.findByLabelText("New password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Reset password" }));
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    authApi.checkResetToken.mockReset();
    authApi.resetPassword.mockReset();
  });

  it("checks the token and strips it from the address bar", async () => {
    authApi.checkResetToken.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByRole("heading", { name: "Choose a new password" })).toBeVisible();
    expect(authApi.checkResetToken).toHaveBeenCalledWith("abc");
    expect(window.location.hash).toBe("");
  });

  it("shows the expired state for an invalid link", async () => {
    authApi.checkResetToken.mockRejectedValue(invalid());
    renderPage();
    expect(await screen.findByRole("heading", { name: "This link has expired" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("treats a missing token as an invalid link without calling the API", async () => {
    renderPage("");
    expect(await screen.findByRole("heading", { name: "This link has expired" })).toBeVisible();
    expect(authApi.checkResetToken).not.toHaveBeenCalled();
  });

  it("flags a password mismatch before submitting", async () => {
    authApi.checkResetToken.mockResolvedValue(null);
    renderPage();
    await fillAndSubmit("secret-pass1!", "different-pass1!");
    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it("changes the password, signs out locally and shows the success state", async () => {
    authApi.checkResetToken.mockResolvedValue(null);
    authApi.resetPassword.mockResolvedValue(null);
    const listener = vi.fn();
    const unsubscribe = session.onSignedOut(listener);
    renderPage();
    await fillAndSubmit("secret-pass1!", "secret-pass1!");
    expect(await screen.findByRole("heading", { name: "Password changed" })).toBeVisible();
    expect(authApi.resetPassword).toHaveBeenCalledWith({ token: "abc", password: "secret-pass1!" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");
    unsubscribe();
  });

  it("switches to the expired state when submit reports INVALID_LINK", async () => {
    authApi.checkResetToken.mockResolvedValue(null);
    authApi.resetPassword.mockRejectedValue(invalid());
    renderPage();
    await fillAndSubmit("secret-pass1!", "secret-pass1!");
    expect(await screen.findByRole("heading", { name: "This link has expired" })).toBeVisible();
  });
});
