import { useQuery } from '@tanstack/react-query';

import { getAudit, getCategories, getCategoryReport, getMonthlyReport, getReportSummary, getTransactions, getUsers } from './client';

export const queryKeys = {
  summary: ['reports', 'summary'] as const,
  categoryReport: ['reports', 'by-category'] as const,
  monthly: (year: number) => ['reports', 'monthly', year] as const,
  transactions: ['transactions'] as const,
  categories: ['categories'] as const,
  users: ['users'] as const,
  audit: ['audit'] as const,
};

export function useSummaryQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.summary, queryFn: () => getReportSummary(token!), enabled: Boolean(token) });
}

export function useCategoryReportQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.categoryReport, queryFn: () => getCategoryReport(token!), enabled: Boolean(token) });
}

export function useMonthlyReportQuery(token: string | null, year: number) {
  return useQuery({ queryKey: queryKeys.monthly(year), queryFn: () => getMonthlyReport(token!, year), enabled: Boolean(token) });
}

export function useTransactionsQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.transactions, queryFn: () => getTransactions(token!), enabled: Boolean(token) });
}

export function useCategoriesQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => getCategories(token!), enabled: Boolean(token) });
}

export function useUsersQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.users, queryFn: () => getUsers(token!), enabled: Boolean(token) });
}

export function useAuditQuery(token: string | null) {
  return useQuery({ queryKey: queryKeys.audit, queryFn: () => getAudit(token!), enabled: Boolean(token) });
}
