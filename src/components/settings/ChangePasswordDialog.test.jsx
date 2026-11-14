import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordDialog } from "./ChangePasswordDialog.jsx";

const show = vi.fn();
vi.mock("../../hooks/useToast.js", () => ({ useToast: () => ({ show, dismiss: vi.fn() }) }));

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { email: "asha@example.com", authMethods: ["password"] } }),
}));

vi.mock("../../lib/auth-api.js", () => ({
  authApi: { changePassword: vi.fn(), requestPasswordReset: vi.fn() },
}));

const { authApi } = await import("../../lib/auth-api.js");
const { ApiError } = await import("../../lib/api.js");

const CURRENT = "Old#pass1";
const NEXT = "New#pass22";

// The dialog is not "open" to jsdom, so (as in DeleteAccountDialog.test) fields are set with change events and
// the form, whose footer button is linked by form="…", is submitted directly.
const setField = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.submit(document.getElementById("change-password-form"));

function fill({ current = CURRENT, next = NEXT, confirm = NEXT } = {}) {
  setField("Current password", current);
  setField("New password", next);
  setField("Confirm new password", confirm);
  submit();
}

describe("ChangePasswordDialog", () => {
  const onClose = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it("sends the current and new password, then confirms and closes", async () => {
    authApi.changePassword.mockResolvedValue(null);
    render(<ChangePasswordDialog open onClose={onClose} />);
    fill();

    await waitFor(() =>
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: CURRENT,
        newPassword: NEXT,
      }),
    );
    expect(show).toHaveBeenCalledWith({
      message: "Password changed. Other devices were signed out.",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("checks the confirmation and that the new password differs before calling the API", async () => {
    render(<ChangePasswordDialog open onClose={onClose} />);
    fill({ confirm: "Other#pass3" });
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();

    setField("New password", CURRENT);
    setField("Confirm new password", CURRENT);
    submit();
    expect(
      await screen.findByText("Choose a password different from your current one"),
    ).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it("emails a reset link to the account address when the current password is forgotten", async () => {
    authApi.requestPasswordReset.mockResolvedValue(null);
    render(<ChangePasswordDialog open onClose={onClose} />);
    fireEvent.click(screen.getByText("Forgot your current password?", { selector: "button" }));

    await waitFor(() =>
      expect(authApi.requestPasswordReset).toHaveBeenCalledWith("asha@example.com"),
    );
    await waitFor(() =>
      expect(show).toHaveBeenCalledWith({
        message: "We sent a reset link to asha@example.com. It expires in 30 minutes.",
      }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it("shows a wrong current password on that field and stays open", async () => {
    authApi.changePassword.mockRejectedValue(
      new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Your current password is incorrect",
      }),
    );
    render(<ChangePasswordDialog open onClose={onClose} />);
    fill();

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
