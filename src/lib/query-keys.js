// Every TanStack Query key in one place, so mutations invalidate exactly what they change.
export const queryKeys = {
  accounts: (params = {}) => ["accounts", "list", params],
  accountSummary: () => ["accounts", "summary"],
  account: (id, month) => ["accounts", "detail", id, month ?? null],
  categories: (params = {}) => ["categories", "list", params],
  transactions: (filters = {}) => ["transactions", "list", filters],
  transactionSummary: (filters = {}) => ["transactions", "summary", filters],
  transactionDay: (localDate) => ["transactions", "day", localDate],
  transaction: (id) => ["transactions", "detail", id],
  statsMonth: (month) => ["stats", "month", month],
  statsPeriod: (params) => ["stats", "period", params],
  statsTrend: (params) => ["stats", "trend", params],
  favourites: () => ["favourites"],
  recurrences: () => ["recurrences"],
  sessions: () => ["me", "sessions"],
};

// What a change to entries affects: lists, day views, stats, balances and category usage counts.
export const LEDGER_SCOPES = [["transactions"], ["stats"], ["accounts"], ["categories"]];
