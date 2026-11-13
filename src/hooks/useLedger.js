import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accountsApi,
  categoriesApi,
  favouritesApi,
  recurrencesApi,
  statsApi,
  transactionsApi,
} from "../lib/ledger-api.js";
import { LEDGER_SCOPES, queryKeys } from "../lib/query-keys.js";

// Data hooks for every ledger screen. Server state lives only here (TanStack Query), never copied into component state.

export function useAccounts({ includeArchived = false } = {}) {
  return useQuery({
    queryKey: queryKeys.accounts({ includeArchived }),
    queryFn: () => accountsApi.list({ includeArchived }),
  });
}

export function useAccountSummary() {
  return useQuery({ queryKey: queryKeys.accountSummary(), queryFn: accountsApi.summary });
}

export function useAccount(id, { month } = {}) {
  return useQuery({
    queryKey: queryKeys.account(id, month),
    queryFn: () => accountsApi.get(id, { month }),
    enabled: Boolean(id),
  });
}

export function useCategories({ kind, includeArchived = false } = {}) {
  return useQuery({
    queryKey: queryKeys.categories({ kind, includeArchived }),
    queryFn: () => categoriesApi.list({ kind, includeArchived }),
  });
}

// Lookup maps for showing names next to ids in rows (accounts and categories are small and cached).
export function useLookups() {
  const accounts = useAccounts({ includeArchived: true });
  const categories = useCategories({ includeArchived: true });
  return {
    isLoading: accounts.isLoading || categories.isLoading,
    accountsById: new Map((accounts.data ?? []).map((a) => [a.id, a])),
    categoriesById: new Map((categories.data ?? []).map((c) => [c.id, c])),
  };
}

export function useTransactions(filters = {}, { enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: ({ pageParam }) => transactionsApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.page?.nextCursor ?? undefined,
    select: (data) => ({ ...data, items: data.pages.flatMap((page) => page.data) }),
    enabled,
  });
}

export function useTransactionSummary(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.transactionSummary(filters),
    queryFn: () => transactionsApi.summary(filters),
    enabled,
  });
}

export function useDay(localDate) {
  return useQuery({
    queryKey: queryKeys.transactionDay(localDate),
    queryFn: () => transactionsApi.day(localDate),
    enabled: Boolean(localDate),
  });
}

export function useTransaction(id) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => transactionsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useMonthStats(month) {
  return useQuery({
    queryKey: queryKeys.statsMonth(month),
    queryFn: () => statsApi.month(month),
    enabled: Boolean(month),
  });
}

export function usePeriodStats(params) {
  return useQuery({
    queryKey: queryKeys.statsPeriod(params),
    queryFn: () => statsApi.period(params),
    enabled: Boolean(params?.period),
  });
}

export function useTrend(params) {
  return useQuery({
    queryKey: queryKeys.statsTrend(params),
    queryFn: () => statsApi.trend(params),
  });
}

export function useFavourites() {
  return useQuery({ queryKey: queryKeys.favourites(), queryFn: favouritesApi.list });
}

export function useRecurrences() {
  return useQuery({ queryKey: queryKeys.recurrences(), queryFn: recurrencesApi.list });
}

// Wraps a mutation so that on success it refreshes every query under the given key prefixes.
export function useLedgerMutation(mutationFn, { scopes = LEDGER_SCOPES, onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      await Promise.all(scopes.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      await onSuccess?.(data, variables, context);
    },
  });
}

// Mutations that change entries refresh lists, day views, stats, balances and usage counts.
export const ENTRY_SCOPES = LEDGER_SCOPES;
export const ACCOUNT_SCOPES = [["accounts"], ["transactions"], ["stats"]];
export const CATEGORY_SCOPES = [["categories"], ["stats"]];
export const FAVOURITE_SCOPES = [["favourites"]];
export const RECURRENCE_SCOPES = [["recurrences"]];
