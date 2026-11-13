import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categorySchema } from "../../schemas/category.js";
import { CategoryForm } from "./CategoryForm.jsx";

vi.mock("../../lib/ledger-api.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    categoriesApi: { ...original.categoriesApi, create: vi.fn().mockResolvedValue({ id: "c1" }) },
  };
});

const { categoriesApi } = await import("../../lib/ledger-api.js");

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CategoryForm open onClose={() => {}} kind="expense" />
    </QueryClientProvider>,
  );
}

const submit = () => fireEvent.submit(document.getElementById("category-form"));

describe("CategoryForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a name", async () => {
    setup();
    submit();
    expect(await screen.findByText("Enter a name")).toBeInTheDocument();
    expect(categoriesApi.create).not.toHaveBeenCalled();
  });

  it("creates a category with the chosen icon", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Snacks" } });
    fireEvent.click(screen.getByLabelText("snacks"));
    submit();
    await waitFor(() => expect(categoriesApi.create).toHaveBeenCalled());
    expect(categoriesApi.create.mock.calls[0][0]).toEqual({
      kind: "expense",
      name: "Snacks",
      icon: "snacks",
      color: "c1",
    });
  });

  it("only accepts icons from the allowlist", () => {
    expect(categorySchema.safeParse({ name: "A", icon: "smile", color: "c1" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "A", icon: "food", color: "c1" }).success).toBe(true);
  });
});
