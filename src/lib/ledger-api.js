import { api, apiDownload } from "./api.js";

// One function per backend endpoint (kanaku-pillai-backend docs/api/README.md). Pages never build URLs themselves.

const query = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
};

export const meApi = {
  updateProfile: (body) => api.patch("/me", body),
  updateSettings: (body) => api.patch("/me/settings", body),
  setup: (body) => api.post("/me/setup", body),
  sessions: () => api.get("/me/sessions"),
  revokeSession: (id) => api.delete(`/me/sessions/${id}`),
  deleteAccount: (body) => api.delete("/me", { body }),
};

export const accountsApi = {
  list: ({ includeArchived = false } = {}) => api.get(`/accounts${query({ includeArchived })}`),
  summary: () => api.get("/accounts/summary"),
  get: (id, { month } = {}) => api.get(`/accounts/${id}${query({ month })}`),
  create: (body) => api.post("/accounts", body),
  update: (id, body) => api.patch(`/accounts/${id}`, body),
  archive: (id) => api.post(`/accounts/${id}/archive`),
  unarchive: (id) => api.post(`/accounts/${id}/unarchive`),
  makeDefault: (id) => api.post(`/accounts/${id}/default`),
  remove: (id) => api.delete(`/accounts/${id}`),
  reorder: (ids) => api.put("/accounts/order", { ids }),
};

export const categoriesApi = {
  list: ({ kind, includeArchived = false } = {}) =>
    api.get(`/categories${query({ kind, includeArchived })}`),
  create: (body) => api.post("/categories", body),
  update: (id, body) => api.patch(`/categories/${id}`, body),
  archive: (id) => api.post(`/categories/${id}/archive`),
  unarchive: (id) => api.post(`/categories/${id}/unarchive`),
  remove: (id) => api.delete(`/categories/${id}`),
  reorder: (kind, ids) => api.put("/categories/order", { kind, ids }),
};

// filters: { from, to, type, accountId, categoryId, q, min, max, cursor, limit }
export const transactionsApi = {
  list: (filters = {}) => api.getPage(`/transactions${query(filters)}`),
  summary: (filters = {}) => api.get(`/transactions/summary${query(filters)}`),
  day: (localDate) => api.get(`/transactions/day/${localDate}`),
  get: (id) => api.get(`/transactions/${id}`),
  create: (body, { idempotencyKey } = {}) =>
    api.post("/transactions", body, { headers: { "Idempotency-Key": idempotencyKey } }),
  update: (id, body) => api.patch(`/transactions/${id}`, body),
  remove: (id) => api.delete(`/transactions/${id}`),
  restore: (id) => api.post(`/transactions/${id}/restore`),
  duplicate: (id, body = {}, { idempotencyKey } = {}) =>
    api.post(`/transactions/${id}/duplicate`, body, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  exportCsv: (filters = {}) => apiDownload(`/transactions/export.csv${query(filters)}`),
};

export const statsApi = {
  month: (month) => api.get(`/stats/month/${month}`),
  period: ({ period, ref, type }) => api.get(`/stats/period${query({ period, ref, type })}`),
  trend: ({ months, end, type }) => api.get(`/stats/trend${query({ months, end, type })}`),
};

export const favouritesApi = {
  list: () => api.get("/favourites"),
  create: (body) => api.post("/favourites", body),
  update: (id, body) => api.patch(`/favourites/${id}`, body),
  remove: (id) => api.delete(`/favourites/${id}`),
  reorder: (ids) => api.put("/favourites/order", { ids }),
};

export const recurrencesApi = {
  list: () => api.get("/recurrences"),
  update: (id, body) => api.patch(`/recurrences/${id}`, body),
  remove: (id) => api.delete(`/recurrences/${id}`),
};
