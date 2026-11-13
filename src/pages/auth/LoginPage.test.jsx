import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AuthContext } from "../../context/auth-context.js";
import { ThemeContext } from "../../context/theme-context.js";
import { ApiError } from "../../lib/api.js";
vi.mock("../../lib/config.js", () => ({ config: { googleClientId: null, appVersion: "0.0.0" } }));

import { LoginPage } from "./LoginPage.jsx";

function renderLogin(login) {
  const auth = { status: "unauthenticated", user: null, login, loginWithGoogle: vi.fn() };
  const theme = { mode: "system", scheme: "light", setMode: vi.fn() };
  return render(
    <ThemeContext.Provider value={theme}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>,
  );
}

describe("LoginPage", () => {
  it("shows validation messages for an empty submit", async () => {
    const login = vi.fn();
    renderLogin(login);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("submits the credentials with keepSignedIn on", async () => {
    const login = vi.fn().mockResolvedValue({});
    renderLogin(login);
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await vi.waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "asha@example.com",
        password: "secret-pass",
        keepSignedIn: true,
      }),
    );
  });

  it("shows an alert for invalid credentials", async () => {
    const error = new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "nope" });
    renderLogin(vi.fn().mockRejectedValue(error));
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
  });
});
