import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../../context/auth-context.js";
import { MonthPage } from "../../pages/MonthPage.jsx";
import { arcPath, barCap, barPercent, donutSegments } from "./chart-math.js";
import { DailyBars } from "./DailyBars.jsx";
import { Donut } from "./Donut.jsx";

vi.mock("../../lib/ledger-api.js", () => {
  const month = new Date().toISOString().slice(0, 7);
  const day = `${month}-01`;
  return {
    accountsApi: {
      list: async () => [{ id: "a1", name: "Cash", icon: "wallet", color: "c2" }],
    },
    categoriesApi: {
      list: async () => [{ id: "c1", name: "Food", icon: "food", color: "c1", kind: "expense" }],
    },
    statsApi: {
      month: async () => ({
        month,
        currencyCode: "INR",
        incomeMinor: 500000,
        expenseMinor: 120000,
        balanceMinor: 380000,
        byCategory: [{ categoryId: "c1", amountMinor: 120000, pct: 100 }],
        byAccount: [{ accountId: "a1", amountMinor: 120000 }],
        days: [{ localDate: day, expenseMinor: 120000, incomeMinor: 500000 }],
      }),
    },
    transactionsApi: {
      list: async () => ({
        data: [
          {
            id: "t1",
            type: "expense",
            amountMinor: 120000,
            currencyCode: "INR",
            categoryId: "c1",
            accountId: "a1",
            note: "Lunch",
            localDate: day,
            occurredAt: `${day}T07:00:00.000Z`,
            tzid: "Asia/Kolkata",
          },
        ],
        page: { nextCursor: null },
      }),
      day: async () => ({ localDate: day, inMinor: 0, outMinor: 0, count: 0, items: [] }),
    },
  };
});

describe("chart-math", () => {
  it("draws a quarter arc from the top to the right", () => {
    expect(arcPath({ from: 0, to: 0.25 })).toBe("M 50 10 A 40 40 0 0 1 90 50");
  });

  it("draws a half arc from the top to the bottom", () => {
    expect(arcPath({ from: 0, to: 0.5 })).toBe("M 50 10 A 40 40 0 0 1 50 90");
  });

  it("is safe with a zero total", () => {
    expect(donutSegments([{ id: "x", amountMinor: 0 }])).toEqual([]);
    expect(arcPath({ from: 0.3, to: 0.3 })).toBe("");
    expect(barPercent(0, 0)).toBe(0);
    expect(barCap([0, 0])).toBe(0);
  });

  it("caps tall bars", () => {
    const cap = barCap([100, 100, 100, 100, 10000]);
    expect(barPercent(10000, cap)).toBe(100);
  });
});

describe("Donut", () => {
  it("labels every category with its percent", () => {
    render(
      <Donut
        title="Spending by category"
        segments={[
          { id: "1", label: "Food", tone: "c1", amountMinor: 300, pct: 75 },
          { id: "2", label: "Bus", tone: "c2", amountMinor: 100, pct: 25 },
        ]}
        centreLabel="Spent"
        centreValue="₹4"
      />,
    );
    const label = screen.getByRole("img").getAttribute("aria-label");
    expect(label).toContain("Food 75%");
    expect(label).toContain("Bus 25%");
    expect(screen.getByText("Spent")).toBeInTheDocument();
  });
});

describe("DailyBars", () => {
  it("renders one labelled button per day and reports selection", () => {
    const onSelect = vi.fn();
    const days = [
      { localDate: "2026-10-01", expenseMinor: 5000, incomeMinor: 0 },
      { localDate: "2026-10-02", expenseMinor: 0, incomeMinor: 0 },
      { localDate: "2026-10-03", expenseMinor: 0, incomeMinor: 0 },
    ];
    render(
      <DailyBars
        days={days}
        selected="2026-10-01"
        today="2026-10-02"
        onSelect={onSelect}
        currencyCode="INR"
        locale="en-IN"
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].getAttribute("aria-label")).toMatch(/spent$/);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith("2026-10-02");
  });
});

describe("MonthPage", () => {
  it("shows the balance and a date group", async () => {
    const user = {
      id: "1",
      name: "Asha",
      email: "a@example.com",
      settings: { currencyCode: "INR", locale: "en-IN", tzid: "UTC", weekStart: "mon" },
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={{ status: "authenticated", user }}>
          <MemoryRouter>
            <MonthPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    const balance = await screen.findAllByText(/3,800.00/);
    expect(balance.length).toBeGreaterThan(0);
    expect(balance.length).toBeGreaterThan(0);
    expect(await screen.findByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Open day view")).toBeInTheDocument();
  });
});
