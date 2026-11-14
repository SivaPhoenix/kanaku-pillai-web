import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext } from "../context/auth-context.js";
import { ToastContext } from "../context/toast-context.js";
import { ListsPage } from "./ListsPage.jsx";

vi.mock("../lib/ledger-api.js", () => ({
  accountsApi: { list: vi.fn(), reorder: vi.fn() },
  categoriesApi: { list: vi.fn(), reorder: vi.fn() },
}));

const { accountsApi, categoriesApi } = await import("../lib/ledger-api.js");

const user = {
  id: "u1",
  name: "Asha",
  email: "asha@example.com",
  authMethods: ["password"],
  settings: { currencyCode: "INR", locale: "en-IN", tzid: "Asia/Kolkata", weekStart: "mon" },
};

function renderLists(entries, initialIndex) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AuthContext.Provider value={{ status: "authenticated", user }}>
      <ToastContext.Provider value={{ show: vi.fn(), dismiss: vi.fn() }}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
            <Routes>
              <Route path="/add" element={<p>Entry page</p>} />
              <Route path="/settings" element={<p>Settings page</p>} />
              <Route path="/lists" element={<ListsPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ToastContext.Provider>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  accountsApi.list.mockResolvedValue([]);
  categoriesApi.list.mockResolvedValue([]);
});

describe("ListsPage back button", () => {
  it("returns to the entry form it was opened from, even after switching tabs", async () => {
    renderLists(
      [
        "/add",
        { pathname: "/lists", search: "?tab=expense", state: { backLabel: "Back to entry" } },
      ],
      1,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Income" }));
    await userEvent.click(screen.getByRole("button", { name: "Back to entry" }));
    expect(await screen.findByText("Entry page")).toBeInTheDocument();
  });

  it("goes to Settings when opened without a return screen", async () => {
    renderLists(["/lists?tab=expense"], 0);

    await userEvent.click(screen.getByRole("link", { name: "Back to Settings" }));
    expect(await screen.findByText("Settings page")).toBeInTheDocument();
  });
});
