import { describe, expect, it } from "vitest";
import {
  buildCreateBody,
  buildUpdateBody,
  createTransactionSchema,
  fieldsForType,
  instalmentsAllowed,
  minorToInput,
} from "./transaction.js";

const schema = createTransactionSchema("INR");
const base = {
  type: "expense",
  amount: "240",
  categoryId: "c1",
  accountId: "a1",
  toAccountId: "",
  date: "2026-11-13",
  time: "09:30",
  note: "",
};

const issues = (values) => {
  const result = schema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe("transaction schema", () => {
  it("accepts a valid expense", () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it("requires an amount greater than zero", () => {
    expect(issues({ ...base, amount: "" }).amount).toBeTruthy();
    expect(issues({ ...base, amount: "0" }).amount).toBeTruthy();
    expect(issues({ ...base, amount: "0.00" }).amount).toBeTruthy();
    expect(issues({ ...base, amount: "12.345" }).amount).toBeTruthy();
    expect(issues({ ...base, amount: "1,240.50" }).amount).toBeUndefined();
  });

  it("requires a category for income and expense", () => {
    expect(issues({ ...base, categoryId: "" }).categoryId).toBe("Choose a category");
    expect(issues({ ...base, type: "income", categoryId: "" }).categoryId).toBeTruthy();
  });

  it("requires different From and To accounts for transfers", () => {
    const transfer = { ...base, type: "transfer", categoryId: "", toAccountId: "a1" };
    expect(issues(transfer).toAccountId).toMatch(/different/);
    expect(issues({ ...transfer, toAccountId: "" }).toAccountId).toBeTruthy();
    expect(issues({ ...transfer, toAccountId: "a2" })).toEqual({});
  });
});

describe("transaction helpers", () => {
  it("clears fields that no longer apply when the type changes", () => {
    expect(fieldsForType({ ...base, toAccountId: "a2" }, "transfer").categoryId).toBe("");
    expect(fieldsForType({ ...base, toAccountId: "a2" }, "income").toAccountId).toBe("");
  });

  it("converts minor units to input text", () => {
    expect(minorToInput(24000, "INR")).toBe("240");
    expect(minorToInput(24050, "INR")).toBe("240.5");
    expect(minorToInput(5, "INR")).toBe("0.05");
    expect(minorToInput(0, "INR")).toBe("");
  });

  it("builds a create body with integer minor units, an ISO instant and the zone", () => {
    const body = buildCreateBody(base, {
      currencyCode: "INR",
      tzid: "Asia/Kolkata",
      repeat: { mode: "repeat", freq: "weekly", endsOn: "" },
    });
    expect(body.amountMinor).toBe(24000);
    expect(body.occurredAt).toBe("2026-11-13T04:00:00.000Z");
    expect(body.tzid).toBe("Asia/Kolkata");
    expect(body.repeat).toEqual({ freq: "weekly", interval: 1, endsOn: null });
    expect(body.toAccountId).toBeUndefined();
  });

  it("allows instalments only for credit-card expenses", () => {
    expect(instalmentsAllowed("expense", { type: "credit_card" })).toBe(true);
    expect(instalmentsAllowed("income", { type: "credit_card" })).toBe(false);
    expect(instalmentsAllowed("expense", { type: "bank" })).toBe(false);
  });

  it("builds an update body with only changed fields and clears unused ones", () => {
    const tx = {
      type: "expense",
      amountMinor: 24000,
      categoryId: "c1",
      accountId: "a1",
      toAccountId: null,
      occurredAt: "2026-11-13T04:00:00.000Z",
      tzid: "Asia/Kolkata",
      note: "",
    };
    expect(buildUpdateBody(base, tx, { currencyCode: "INR" })).toEqual({});
    const toTransfer = { ...base, type: "transfer", categoryId: "", toAccountId: "a2" };
    expect(buildUpdateBody(toTransfer, tx, { currencyCode: "INR" })).toEqual({
      type: "transfer",
      toAccountId: "a2",
      categoryId: null,
    });
  });
});
