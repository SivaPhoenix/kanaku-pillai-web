import { z } from "zod";
import { CATEGORY_ICON_NAMES } from "../lib/icons.js";
import { minorDigits, parseAmountToMinor } from "../lib/money.js";

export const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
  { value: "investment", label: "Investment" },
];

export const COLOR_NAMES = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"];

const optionalDay = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d{1,2}$/.test(v) && Number(v) >= 1 && Number(v) <= 28), {
    message: "Enter a day from 1 to 28",
  });

// Form fields are strings; toAccountPayload() converts them to the API body (integer minor units).
export const accountSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name").max(40, "Use at most 40 characters"),
    type: z.enum(ACCOUNT_TYPES.map((t) => t.value)),
    icon: z.enum(CATEGORY_ICON_NAMES, { error: "Choose an icon" }),
    color: z.enum(COLOR_NAMES, { error: "Choose a colour" }),
    last4: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}$/.test(v), { message: "Enter 4 digits" }),
    openingBalance: z.string().trim(),
    linkedAccountId: z.string(),
    creditLimit: z.string().trim(),
    statementDay: optionalDay,
    dueDay: optionalDay,
  })
  .superRefine((values, ctx) => {
    if (values.type === "debit_card" && !values.linkedAccountId) {
      ctx.addIssue({ code: "custom", path: ["linkedAccountId"], message: "Choose a bank account" });
    }
  });

export const ACCOUNT_DEFAULTS = {
  name: "",
  type: "bank",
  icon: "bank",
  color: "c2",
  last4: "",
  openingBalance: "",
  linkedAccountId: "",
  creditLimit: "",
  statementDay: "",
  dueDay: "",
};

// Optional amount text: "" is "not set"; returns undefined for invalid text.
function minorOrNull(text, currencyCode, { allowNegative = false } = {}) {
  if (text === "") return null;
  const negative = allowNegative && text.startsWith("-");
  const minor = parseAmountToMinor(negative ? text.slice(1) : text, currencyCode);
  if (minor === null) return undefined;
  return negative ? -minor : minor;
}

// Returns { payload } or { errors } where errors maps form field names to messages.
export function toAccountPayload(values, currencyCode, { editing = false } = {}) {
  const errors = {};
  const isCredit = values.type === "credit_card";
  const opening = minorOrNull(values.openingBalance, currencyCode, {
    allowNegative: !isCredit,
  });
  if (opening === undefined) errors.openingBalance = "Enter a valid amount";
  const limit = isCredit ? minorOrNull(values.creditLimit, currencyCode) : null;
  if (limit === undefined || limit === 0) errors.creditLimit = "Enter a valid amount";
  if (Object.keys(errors).length) return { errors };

  const payload = {
    name: values.name,
    type: values.type,
    icon: values.icon,
    color: values.color,
    openingBalanceMinor: opening ?? 0,
  };
  if (values.last4) payload.last4 = values.last4;
  else if (editing) payload.last4 = null;
  if (values.type === "debit_card") payload.linkedAccountId = values.linkedAccountId;
  if (isCredit) {
    payload.creditLimitMinor = limit;
    payload.statementDay = values.statementDay ? Number(values.statementDay) : null;
    payload.dueDay = values.dueDay ? Number(values.dueDay) : null;
  }
  return { payload };
}

// Minor units → editable text ("12345" → "123.45") with string math.
export function minorToInputText(minor, currencyCode) {
  if (minor === null || minor === undefined) return "";
  const digits = minorDigits(currencyCode);
  const sign = minor < 0 ? "-" : "";
  const raw = String(Math.abs(minor)).padStart(digits + 1, "0");
  if (digits === 0) return `${sign}${raw}`;
  const whole = raw.slice(0, -digits);
  const fraction = raw.slice(-digits).replace(/0+$/, "");
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}
