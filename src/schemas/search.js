import { parseAmountToMinor } from "../lib/money.js";

const TYPES = new Set(["income", "expense", "transfer"]);

// URL names (q,type,from,to,category,account,min,max) → API filter names (categoryId, accountId, min/max in minor units).
export function buildSearchFilters(params, currencyCode) {
  const get = (name) => (params.get(name) ?? "").trim();
  const filters = {};
  if (get("q")) filters.q = get("q");
  if (TYPES.has(get("type"))) filters.type = get("type");
  if (/^\d{4}-\d{2}-\d{2}$/.test(get("from"))) filters.from = get("from");
  if (/^\d{4}-\d{2}-\d{2}$/.test(get("to"))) filters.to = get("to");
  if (get("category")) filters.categoryId = get("category");
  if (get("account")) filters.accountId = get("account");
  const min = parseAmountToMinor(get("min"), currencyCode);
  const max = parseAmountToMinor(get("max"), currencyCode);
  if (min !== null) filters.min = min;
  if (max !== null) filters.max = max;
  return filters;
}
