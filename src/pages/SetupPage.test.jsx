import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../context/auth-context.js";
import { ThemeContext } from "../context/theme-context.js";
import { RequireAuth } from "../routes/guards.jsx";
import { SetupPage } from "./SetupPage.jsx";

vi.mock("../lib/ledger-api.js", () => ({ meApi: { setup: vi.fn() } }));
const { meApi } = await import("../lib/ledger-api.js");

const theme = { mode: "system", scheme: "light", setMode: () => {} };

function renderAt(path, auth) {
  return render(
    <ThemeContext value={theme}>
      <AuthContext value={auth}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/month" element={<p>Month screen</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext>
    </ThemeContext>,
  );
}

const newUser = { id: "u1", name: "Siva Ram", email: "s@example.com", setupComplete: false };

describe("first-run setup", () => {
  beforeEach(() => meApi.setup.mockReset());

  it("sends signed-in users who haven't finished setup to /setup", async () => {
    renderAt("/month", { status: "authenticated", user: newUser, refreshUser: vi.fn() });
    expect(await screen.findByRole("heading", { name: "Set up your account" })).toBeInTheDocument();
    expect(screen.getByText("Welcome, Siva")).toBeInTheDocument();
    expect(screen.queryByText("Month screen")).not.toBeInTheDocument();
  });

  it("lets finished users through and keeps them out of setup", async () => {
    renderAt("/setup", {
      status: "authenticated",
      user: { ...newUser, setupComplete: true },
      refreshUser: vi.fn(),
    });
    expect(await screen.findByText("Month screen")).toBeInTheDocument();
  });

  it("submits the chosen currency, device zone and balances in minor units", async () => {
    const user = userEvent.setup();
    const refreshUser = vi.fn().mockResolvedValue({ ...newUser, setupComplete: true });
    meApi.setup.mockResolvedValue({});
    renderAt("/setup", { status: "authenticated", user: newUser, refreshUser });

    await user.click(await screen.findByRole("radio", { name: /USD/ }));
    expect(screen.getByText(/\$123,456\.50/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Savings (bank)"), "1,500.25");
    await user.click(screen.getByRole("button", { name: "Start tracking" }));

    await waitFor(() => expect(meApi.setup).toHaveBeenCalledTimes(1));
    const body = meApi.setup.mock.calls[0][0];
    expect(body).toMatchObject({
      currencyCode: "USD",
      starterCategories: true,
      startingBalances: { savingsMinor: 150025 },
    });
    expect(typeof body.tzid).toBe("string");
    expect(refreshUser).toHaveBeenCalled();
  });

  it("rejects an invalid starting balance without calling the API", async () => {
    const user = userEvent.setup();
    renderAt("/setup", { status: "authenticated", user: newUser, refreshUser: vi.fn() });
    await user.type(await screen.findByLabelText("Wallet (cash)"), "12.345");
    await user.click(screen.getByRole("button", { name: "Start tracking" }));
    expect(await screen.findByText("Enter an amount like 1,234.50")).toBeInTheDocument();
    expect(meApi.setup).not.toHaveBeenCalled();
  });
});
