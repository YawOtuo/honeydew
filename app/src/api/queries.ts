import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getAudit, getCategories, getCategoryReport, getMonthlyReport, getReportSummary, getTransaction, getTransactions, getUsers } from './client';
import type { TransactionFilters } from './client';

export const queryKeys = {
  summary: ['reports', 'summary'] as const,
  categoryReport: ['reports', 'by-category'] as const,
  monthly: (year: number) => ['reports', 'monthly', year] as const,
  transactions: ['transactions'] as const,
  categories: ['categories'] as const,
  managedCategories: ['categories', 'managed'] as const,
  users: ['users'] as const,
  audit: ['audit'] as const,
};

export function useSummaryQuery(token: string | null, filters: TransactionFilters = {}) {
  return useQuery({ queryKey: [...queryKeys.summary, filters], queryFn: () => getReportSummary(token!, filters), enabled: Boolean(token) });
}

export function useCategoryReportQuery(token: string | null, filters: TransactionFilters = {}) {
  return useQuery({ queryKey: [...queryKeys.categoryReport, filters], queryFn: () => getCategoryReport(token!, filters), enabled: Boolean(token) });
}

export function useMonthlyReportQuery(token: string | null, year: number) {
  return useQuery({ queryKey: queryKeys.monthly(year), queryFn: () => getMonthlyReport(token!, year), enabled: Boolean(token) });
}

export function useTransactionsQuery(token: string | null, filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.transactions, filters],
    queryFn: ({ pageParam }) => getTransactions(token!, { ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: Boolean(token),
  });
}

export function useTransactionQuery(token: string | null, id?: string) {
  return useQuery({ queryKey: [...queryKeys.transactions, 'detail', id], queryFn: () => getTransaction(token!, id!), enabled: Boolean(token) && Boolean(id) });
}

export function useCategoriesQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => getCategories(token!), enabled: Boolean(token) });
}

export function useManagedCategoriesQuery(token: string | null, isAdmin: boolean) {
  return useQuery({ queryKey: queryKeys.managedCategories, queryFn: () => getCategories(token!, true), enabled: Boolean(token) && isAdmin });
}

export function useUsersQuery(token: string | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.users, queryFn: () => getUsers(token!), enabled: Boolean(token) && enabled });
}

export function useAuditQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.audit, queryFn: () => getAudit(token!), enabled: Boolean(token) });
}
