import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ApiError } from "../../lib/api.js";

vi.mock("../../lib/auth-api.js", () => ({ authApi: { requestPasswordReset: vi.fn() } }));
const { authApi } = await import("../../lib/auth-api.js");
const { ForgotPasswordPage } = await import("./ForgotPasswordPage.jsx");

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

async function submit(email) {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => authApi.requestPasswordReset.mockReset());

  it("sends the request and shows the masked address with a resend countdown", async () => {
    authApi.requestPasswordReset.mockResolvedValue(null);
    renderPage();
    await submit("siva@example.com");
    expect(authApi.requestPasswordReset).toHaveBeenCalledWith("siva@example.com");
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/s•••@example\.com/)).toBeInTheDocument();
    expect(screen.queryByText(/siva@example\.com/)).not.toBeInTheDocument();
    expect(screen.getByText("Resend in 0:60")).toBeInTheDocument();
  });

  it("shows the same screen for any address", async () => {
    authApi.requestPasswordReset.mockResolvedValue(null);
    renderPage();
    await submit("nobody@example.org");
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/n•••@example\.org/)).toBeInTheDocument();
  });

  it("validates the email before calling the API", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(authApi.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("shows the server message on a rate limit and goes back from step two", async () => {
    authApi.requestPasswordReset.mockRejectedValue(
      new ApiError({ status: 429, code: "RATE_LIMITED", message: "Too many requests" }),
    );
    renderPage();
    await submit("siva@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");

    authApi.requestPasswordReset.mockResolvedValue(null);
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await userEvent.click(await screen.findByRole("button", { name: "Use a different email" }));
    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
  });
});
