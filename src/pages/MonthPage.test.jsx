import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AuthContext } from "../context/auth-context.js";
import { MonthPage } from "./MonthPage.jsx";

vi.mock("../lib/ledger-api.js", () => ({
  accountsApi: { list: vi.fn() },
  categoriesApi: { list: vi.fn() },
  transactionsApi: { list: vi.fn(), day: vi.fn() },
  statsApi: { month: vi.fn() },
}));

const { accountsApi, categoriesApi, transactionsApi, statsApi } =
  await import("../lib/ledger-api.js");

const user = {
  id: "u1",
  name: "Asha",
  email: "asha@example.com",
  authMethods: ["password"],
  settings: { currencyCode: "INR", locale: "en-IN", tzid: "Asia/Kolkata", weekStart: "mon" },
};

const days = Array.from({ length: 30 }, (_, i) => ({
  localDate: `2026-11-${String(i + 1).padStart(2, "0")}`,
  expenseMinor: 0,
  incomeMinor: 0,
}));

function stats(overrides) {
  return {
    month: "2026-11",
    currencyCode: "INR",
    incomeMinor: 11435500,
    expenseMinor: 382500,
    balanceMinor: 11053000,
    investedMinor: 0,
    withdrawnMinor: 0,
    afterInvestingMinor: 11053000,
    byCategory: [],
    byAccount: [],
    days,
    ...overrides,
  };
}

function renderMonth() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AuthContext.Provider value={{ status: "authenticated", user }}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/month?m=2026-11"]}>
          <MonthPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  accountsApi.list.mockResolvedValue([]);
  categoriesApi.list.mockResolvedValue([]);
  transactionsApi.list.mockResolvedValue({ data: [], page: { nextCursor: null, limit: 50 } });
  transactionsApi.day.mockResolvedValue([]);
});

describe("MonthPage investing summary", () => {
  it("shows invested and what is left after investing, as the API reports them", async () => {
    statsApi.month.mockResolvedValue(
      stats({ investedMinor: 700000, afterInvestingMinor: 10353000 }),
    );
    renderMonth();

    const [group] = await screen.findAllByRole("group", { name: "Investing this month" });
    expect(within(group).getByText("Invested")).toBeInTheDocument();
    expect(within(group).getByText("₹7,000.00")).toBeInTheDocument();
    expect(within(group).getByText("₹1,03,530.00")).toBeInTheDocument();
    expect(within(group).queryByText("Taken out of investments")).not.toBeInTheDocument();
  });

  it("lists money taken out of investments when there is some", async () => {
    statsApi.month.mockResolvedValue(
      stats({ investedMinor: 700000, withdrawnMinor: 20000, afterInvestingMinor: 10373000 }),
    );
    renderMonth();

    const [group] = await screen.findAllByRole("group", { name: "Investing this month" });
    expect(within(group).getByText("Taken out of investments")).toBeInTheDocument();
    expect(within(group).getByText("₹200.00")).toBeInTheDocument();
  });

  it("hides the section when nothing moved to or from investments", async () => {
    statsApi.month.mockResolvedValue(stats());
    renderMonth();

    expect(await screen.findAllByText("₹1,10,530.00")).not.toHaveLength(0);
    expect(screen.queryByRole("group", { name: "Investing this month" })).not.toBeInTheDocument();
  });
});
