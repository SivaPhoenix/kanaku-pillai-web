import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext } from "../context/auth-context.js";
import { ThemeContext } from "../context/theme-context.js";
import { ToastContext } from "../context/toast-context.js";
import { AddTransactionPage } from "./AddTransactionPage.jsx";

vi.mock("../lib/ledger-api.js", () => ({
  accountsApi: { list: vi.fn() },
  categoriesApi: { list: vi.fn() },
  transactionsApi: { create: vi.fn(), update: vi.fn(), get: vi.fn() },
  favouritesApi: { list: vi.fn(), create: vi.fn() },
  recurrencesApi: { list: vi.fn() },
  statsApi: {},
}));

const { accountsApi, categoriesApi, transactionsApi, favouritesApi } =
  await import("../lib/ledger-api.js");

const user = {
  id: "u1",
  name: "Asha",
  email: "asha@example.com",
  authMethods: ["password"],
  settings: { currencyCode: "INR", locale: "en-IN", tzid: "Asia/Kolkata", weekStart: "mon" },
};
const accounts = [
  { id: "a1", name: "Savings", type: "bank", isDefault: true, archived: false },
  { id: "a2", name: "Cash", type: "cash", isDefault: false, archived: false },
  { id: "a3", name: "Debit", type: "debit_card", isDefault: false, archived: false },
];
const categories = [
  { id: "c1", kind: "expense", name: "Food", icon: "food", color: "c1", archived: false },
  { id: "c2", kind: "income", name: "Salary", icon: "salary", color: "c2", archived: false },
];

function renderPage(path = "/add") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const toast = { show: vi.fn(), dismiss: vi.fn() };
  render(
    <ThemeContext.Provider value={{ mode: "system", scheme: "light", setMode: vi.fn() }}>
      <AuthContext.Provider value={{ status: "authenticated", user }}>
        <ToastContext.Provider value={toast}>
          <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="/add" element={<AddTransactionPage />} />
                <Route path="/daily" element={<p>Daily page</p>} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>,
  );
  return toast;
}

beforeEach(() => {
  vi.clearAllMocks();
  accountsApi.list.mockResolvedValue(accounts);
  categoriesApi.list.mockResolvedValue(categories);
  favouritesApi.list.mockResolvedValue([]);
});

describe("AddTransactionPage", () => {
  it("shows categories for expenses and From/To for transfers", async () => {
    renderPage();
    expect(await screen.findByRole("radio", { name: /Food/ })).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Transfer" }));
    expect(screen.queryByText("CATEGORY")).not.toBeInTheDocument();
    expect(screen.getByText("FROM")).toBeInTheDocument();
    expect(screen.getByText("TO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swap accounts" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Debit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New transfer" })).toBeInTheDocument();
  });

  it("validates before calling the API", async () => {
    renderPage();
    await screen.findByRole("radio", { name: /Food/ });
    await userEvent.click(screen.getByRole("button", { name: "Save expense" }));
    expect(await screen.findByText("Enter an amount greater than zero")).toBeInTheDocument();
    expect(screen.getByText("Choose a category")).toBeInTheDocument();
    expect(transactionsApi.create).not.toHaveBeenCalled();
  });

  it("creates a valid expense with integer minor units, an ISO instant and the zone", async () => {
    transactionsApi.create.mockResolvedValue({ id: "t1", localDate: "2026-11-13" });
    const toast = renderPage();
    await userEvent.type(await screen.findByLabelText("AMOUNT"), "240.50");
    await userEvent.click(screen.getByRole("radio", { name: /Food/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save expense" }));

    await waitFor(() => expect(transactionsApi.create).toHaveBeenCalledTimes(1));
    const [body, options] = transactionsApi.create.mock.calls[0];
    expect(body.type).toBe("expense");
    expect(body.amountMinor).toBe(24050);
    expect(Number.isInteger(body.amountMinor)).toBe(true);
    expect(body.categoryId).toBe("c1");
    expect(body.accountId).toBe("a1");
    expect(body.tzid).toBe("Asia/Kolkata");
    expect(new Date(body.occurredAt).toISOString()).toBe(body.occurredAt);
    expect(options.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByText("Daily page")).toBeInTheDocument();
    expect(toast.show).toHaveBeenCalledWith({ message: "Saved" });
  });
});
