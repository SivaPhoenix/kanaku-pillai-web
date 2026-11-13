import { z } from "zod";
import { minorDigits, parseAmountToMinor } from "../lib/money.js";
import { toInstant } from "../lib/ledger-format.js";

export const TRANSACTION_TYPES = ["income", "expense", "transfer"];

export const NO_REPEAT = { mode: "none", freq: "monthly", endsOn: "", months: 6 };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

// Mirrors the backend's transaction rules so users see problems before submitting.
export function createTransactionSchema(currencyCode) {
  return z
    .object({
      type: z.enum(TRANSACTION_TYPES),
      amount: z.string(),
      categoryId: z.string(),
      accountId: z.string(),
      toAccountId: z.string(),
      date: z.string().regex(DATE, "Choose a date"),
      time: z.string().regex(TIME, "Choose a time"),
      note: z.string().max(140, "Use at most 140 characters"),
    })
    .superRefine((values, ctx) => {
      const minor = parseAmountToMinor(values.amount, currencyCode);
      if (minor === null || minor <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Enter an amount greater than zero",
        });
      }
      if (values.type === "transfer") {
        if (!values.accountId) {
          ctx.addIssue({ code: "custom", path: ["accountId"], message: "Choose the From account" });
        }
        if (!values.toAccountId) {
          ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Choose the To account" });
        } else if (values.toAccountId === values.accountId) {
          ctx.addIssue({
            code: "custom",
            path: ["toAccountId"],
            message: "From and To must be different accounts",
          });
        }
        return;
      }
      if (!values.categoryId) {
        ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category" });
      }
      if (!values.accountId) {
        ctx.addIssue({ code: "custom", path: ["accountId"], message: "Choose an account" });
      }
    });
}

// Integer minor units to the text shown in the amount field ("240", "240.5").
export function minorToInput(minor, currencyCode) {
  if (!Number.isFinite(minor) || minor <= 0) return "";
  const digits = minorDigits(currencyCode);
  if (digits === 0) return String(minor);
  const text = String(minor).padStart(digits + 1, "0");
  const whole = text.slice(0, -digits);
  const fraction = text.slice(-digits).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

// Keeps only what the chosen type uses, so switching type never leaves stale values behind.
export function fieldsForType(values, type) {
  return {
    ...values,
    type,
    categoryId: type === "transfer" ? "" : values.categoryId,
    toAccountId: type === "transfer" ? values.toAccountId : "",
  };
}

export function repeatLabel(repeat) {
  if (repeat.mode === "instalments") return `${repeat.months} instalments`;
  if (repeat.mode === "repeat") {
    return { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }[repeat.freq];
  }
  return "Repeat";
}

export function instalmentsAllowed(type, account) {
  return type === "expense" && account?.type === "credit_card";
}

// Body for POST /transactions.
export function buildCreateBody(values, { currencyCode, tzid, repeat }) {
  const body = {
    type: values.type,
    amountMinor: parseAmountToMinor(values.amount, currencyCode),
    accountId: values.accountId,
    occurredAt: toInstant(values.date, values.time, tzid),
    tzid,
    note: values.note.trim(),
  };
  if (values.type === "transfer") body.toAccountId = values.toAccountId;
  else body.categoryId = values.categoryId;
  if (repeat?.mode === "repeat") {
    body.repeat = { freq: repeat.freq, interval: 1, endsOn: repeat.endsOn || null };
  }
  if (repeat?.mode === "instalments") body.instalments = { months: repeat.months };
  return body;
}

// Body for PATCH /transactions/:id: only the fields that changed, clearing the ones the new type no longer uses.
export function buildUpdateBody(values, tx, { currencyCode }) {
  const body = {};
  const amountMinor = parseAmountToMinor(values.amount, currencyCode);
  if (values.type !== tx.type) body.type = values.type;
  if (amountMinor !== tx.amountMinor) body.amountMinor = amountMinor;
  if (values.accountId !== tx.accountId) body.accountId = values.accountId;
  if (values.type === "transfer") {
    if (values.toAccountId !== (tx.toAccountId ?? "")) body.toAccountId = values.toAccountId;
    if (tx.categoryId) body.categoryId = null;
  } else {
    if (values.categoryId !== (tx.categoryId ?? "")) body.categoryId = values.categoryId;
    if (tx.toAccountId) body.toAccountId = null;
  }
  const occurredAt = toInstant(values.date, values.time, tx.tzid);
  if (new Date(occurredAt).getTime() !== new Date(tx.occurredAt).getTime()) {
    body.occurredAt = occurredAt;
  }
  const note = values.note.trim();
  if (note !== (tx.note ?? "")) body.note = note;
  return body;
}
