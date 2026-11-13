import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountForm } from "./AccountForm.jsx";

vi.mock("../../hooks/useSettings.js", () => ({
  useSettings: () => ({ currencyCode: "INR", locale: "en-IN" }),
}));

vi.mock("../../lib/ledger-api.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    accountsApi: { ...original.accountsApi, create: vi.fn().mockResolvedValue({ id: "a1" }) },
  };
});

const { accountsApi } = await import("../../lib/ledger-api.js");

const banks = [{ id: "b1", name: "Savings", type: "bank", archived: false }];

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AccountForm open onClose={() => {}} accounts={banks} />
    </QueryClientProvider>,
  );
}

const submit = () => fireEvent.submit(document.getElementById("account-form"));

describe("AccountForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows credit card fields only for credit cards", () => {
    setup();
    expect(screen.queryByLabelText("Credit limit")).toBeNull();
    expect(screen.queryByLabelText("Linked bank")).toBeNull();
    fireEvent.click(screen.getByText("Credit card"));
    expect(screen.getByLabelText("Credit limit")).toBeInTheDocument();
    expect(screen.getByLabelText("Statement day")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount owed at start")).toBeInTheDocument();
  });

  it("shows the linked bank only for debit cards", () => {
    setup();
    fireEvent.click(screen.getByText("Debit card"));
    expect(screen.getByLabelText("Linked bank")).toBeInTheDocument();
    expect(screen.queryByLabelText("Credit limit")).toBeNull();
  });

  it("requires a linked bank for a debit card", async () => {
    setup();
    fireEvent.click(screen.getByText("Debit card"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Debit" } });
    submit();
    expect(await screen.findByText("Choose a bank account")).toBeInTheDocument();
    expect(accountsApi.create).not.toHaveBeenCalled();
  });

  it("submits integer minor units", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "HDFC" } });
    fireEvent.change(screen.getByLabelText("Opening balance"), { target: { value: "1,234.50" } });
    submit();
    await waitFor(() => expect(accountsApi.create).toHaveBeenCalled());
    expect(accountsApi.create.mock.calls[0][0]).toMatchObject({
      name: "HDFC",
      type: "bank",
      openingBalanceMinor: 123450,
    });
  });

  it("sends the credit limit in minor units", async () => {
    setup();
    fireEvent.click(screen.getByText("Credit card"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Card" } });
    fireEvent.change(screen.getByLabelText("Credit limit"), { target: { value: "100000" } });
    fireEvent.change(screen.getByLabelText("Due day"), { target: { value: "5" } });
    submit();
    await waitFor(() => expect(accountsApi.create).toHaveBeenCalled());
    expect(accountsApi.create.mock.calls[0][0]).toMatchObject({
      type: "credit_card",
      creditLimitMinor: 10000000,
      dueDay: 5,
      statementDay: null,
    });
  });
});
