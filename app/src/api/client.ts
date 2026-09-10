const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

type ApiError = { message?: string | string[] };

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string, canRefresh = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && canRefresh && refreshHandler) {
      refreshPromise ??= refreshHandler().finally(() => { refreshPromise = null; });
      const refreshedToken = await refreshPromise;
      if (refreshedToken) return apiRequest<T>(path, options, refreshedToken, false);
    }
    const error = (await response.json().catch(() => ({}))) as ApiError;
    const message = Array.isArray(error.message) ? error.message.join(' ') : error.message;
    throw new Error(message ?? 'Something went wrong. Please try again.');
  }

  return response.json() as Promise<T>;
}

export type AuthUser = { id: string; email: string; role: 'ADMIN' | 'ACCOUNTANT' };
export type LoginResponse = { accessToken: string; refreshToken: string; user: AuthUser };
export type PaymentMethod = 'CASH' | 'MOMO' | 'BANK';

export type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  transactionDate: string;
  description: string | null;
  invoiceNumber: string | null;
  paymentMethod: PaymentMethod | null;
  category: { id: string; name: string; type: 'INCOME' | 'EXPENSE' };
};

export type TransactionListResponse = {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TransactionSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
export type DatePreset = 'any' | 'this_month' | 'last_month' | 'last_30' | 'this_year' | 'custom';

export type TransactionFilters = {
  type?: 'INCOME' | 'EXPENSE';
  categoryIds?: string[];
  paymentMethods?: PaymentMethod[];
  from?: string;
  to?: string;
  search?: string;
  createdById?: string;
  minAmount?: string;
  maxAmount?: string;
  sort?: TransactionSort;
  datePreset?: DatePreset;
  page?: number;
  limit?: number;
};

export type Category = { id: string; name: string; type: 'INCOME' | 'EXPENSE'; color: string | null; isActive: boolean; sortOrder: number };
export type ReportSummary = { income: string; expenses: string; balance: string; recent: Transaction[] };
export type MonthlyReport = { month: number; income: string; expenses: string; balance: string }[];
export type CategoryReport = { category: Category; type: 'INCOME' | 'EXPENSE'; amount: string }[];
export type User = { id: string; email: string; role: 'ADMIN' | 'ACCOUNTANT'; createdAt: string };
export type AuditEntry = { id: string; action: string; entityType: string; details: unknown; createdAt: string; actor: { email: string; role: string } | null };

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshAccessToken(refreshToken: string) {
  return apiRequest<LoginResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, undefined, false);
}

export function filterParams(filters: TransactionFilters) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.categoryIds?.length) params.set('categoryIds', filters.categoryIds.join(','));
  if (filters.paymentMethods?.length) params.set('paymentMethods', filters.paymentMethods.join(','));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.createdById) params.set('createdById', filters.createdById);
  if (filters.minAmount?.trim()) params.set('minAmount', filters.minAmount.trim());
  if (filters.maxAmount?.trim()) params.set('maxAmount', filters.maxAmount.trim());
  return params;
}

export function getTransactions(token: string, filters: TransactionFilters = {}) {
  const params = filterParams(filters);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 30));
  if (filters.sort) params.set('sort', filters.sort);
  return apiRequest<TransactionListResponse>(`/transactions?${params.toString()}`, {}, token);
}

export function getTransaction(token: string, id: string) {
  return apiRequest<Transaction>(`/transactions/${id}`, {}, token);
}

export function getCategories(token: string, includeArchived = false) { return apiRequest<Category[]>(`/categories${includeArchived ? '?includeArchived=true' : ''}`, {}, token); }

export function createCategory(token: string, body: { name: string; type: 'INCOME' | 'EXPENSE' }) {
  return apiRequest<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function updateCategory(token: string, id: string, body: { name: string }) {
  return apiRequest<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function setCategoryActive(token: string, id: string, isActive: boolean) {
  return apiRequest<Category>(`/categories/${id}/${isActive ? 'restore' : 'archive'}`, { method: 'POST' }, token);
}

export function createTransaction(token: string, body: { type: 'INCOME' | 'EXPENSE'; amount: string; categoryId: string; transactionDate: string; description?: string; invoiceNumber?: string; paymentMethod: PaymentMethod }) {
  return apiRequest<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function updateTransaction(token: string, id: string, body: Parameters<typeof createTransaction>[1]) {
  return apiRequest<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function deleteTransaction(token: string, id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/transactions/${id}`, { method: 'DELETE' }, token);
}

export function getReportSummary(token: string, filters: TransactionFilters = {}) {
  const query = filterParams(filters).toString();
  return apiRequest<ReportSummary>(`/reports/summary${query ? `?${query}` : ''}`, {}, token);
}
export function getMonthlyReport(token: string, year = new Date().getFullYear()) { return apiRequest<MonthlyReport>(`/reports/monthly?year=${year}`, {}, token); }
export function getCategoryReport(token: string, filters: TransactionFilters = {}) {
  const query = filterParams(filters).toString();
  return apiRequest<CategoryReport>(`/reports/by-category${query ? `?${query}` : ''}`, {}, token);
}
export function createUser(token: string, body: { email: string; password: string; role: 'ADMIN' | 'ACCOUNTANT' }) { return apiRequest<AuthUser>('/users', { method: 'POST', body: JSON.stringify(body) }, token); }
export function getUsers(token: string) { return apiRequest<User[]>('/users', {}, token); }
export function getMe(token: string) { return apiRequest<AuthUser>('/users/me', {}, token); }
export function getAudit(token: string) { return apiRequest<{ items: AuditEntry[] }>('/audit?page=1&limit=50', {}, token); }
