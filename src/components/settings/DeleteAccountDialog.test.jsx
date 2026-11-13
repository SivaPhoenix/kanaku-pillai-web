import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteAccountDialog } from "./DeleteAccountDialog.jsx";

const logout = vi.fn().mockResolvedValue();
let authMethods = ["password"];

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { authMethods }, logout }),
}));

vi.mock("../../lib/ledger-api.js", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, meApi: { ...original.meApi, deleteAccount: vi.fn() } };
});

const { meApi } = await import("../../lib/ledger-api.js");
const { ApiError } = await import("../../lib/api.js");

function setup() {
  return render(
    <MemoryRouter>
      <DeleteAccountDialog open onClose={() => {}} />
    </MemoryRouter>,
  );
}

const deleteButton = () => screen.getByText("Delete account", { selector: "button" });
const typeConfirm = (value) =>
  fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value } });
const typePassword = (value) =>
  fireEvent.change(screen.getByLabelText("Password"), { target: { value } });

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMethods = ["password"];
  });

  it("stays disabled until DELETE is typed and a password given", () => {
    setup();
    expect(deleteButton()).toBeDisabled();
    typeConfirm("delete");
    typePassword("secret");
    expect(deleteButton()).toBeDisabled();
    typeConfirm("DELETE");
    expect(deleteButton()).toBeEnabled();
  });

  it("deletes, then signs out", async () => {
    meApi.deleteAccount.mockResolvedValue(null);
    setup();
    typeConfirm("DELETE");
    typePassword("secret");
    fireEvent.submit(document.getElementById("delete-account-form"));
    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(meApi.deleteAccount).toHaveBeenCalledWith({ confirm: "DELETE", password: "secret" });
  });

  it("omits the password field for Google-only users", () => {
    authMethods = ["google"];
    setup();
    expect(screen.queryByLabelText("Password")).toBeNull();
    typeConfirm("DELETE");
    expect(deleteButton()).toBeEnabled();
  });

  it("shows a field error for a wrong password", async () => {
    meApi.deleteAccount.mockRejectedValue(
      new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "Invalid" }),
    );
    setup();
    typeConfirm("DELETE");
    typePassword("nope");
    fireEvent.submit(document.getElementById("delete-account-form"));
    expect(await screen.findByText("Password is incorrect")).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });
});
