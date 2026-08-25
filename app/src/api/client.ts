const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';

type ApiError = { message?: string | string[] };

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    const message = Array.isArray(error.message) ? error.message.join(' ') : error.message;
    throw new Error(message ?? 'Something went wrong. Please try again.');
  }

  return response.json() as Promise<T>;
}

export type AuthUser = { id: string; email: string; role: 'ADMIN' | 'ACCOUNTANT' };
export type LoginResponse = { accessToken: string; user: AuthUser };

export type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  transactionDate: string;
  description: string | null;
  invoiceNumber: string | null;
  paymentMethod: 'CASH' | null;
  category: { id: string; name: string; type: 'INCOME' | 'EXPENSE' };
};

export type TransactionListResponse = {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Category = { id: string; name: string; type: 'INCOME' | 'EXPENSE'; color: string | null };
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

export function getTransactions(token: string) {
  return apiRequest<TransactionListResponse>('/transactions?page=1&limit=50', {}, token);
}

export function getCategories(token: string) { return apiRequest<Category[]>('/categories', {}, token); }

export function createTransaction(token: string, body: { type: 'INCOME' | 'EXPENSE'; amount: string; categoryId: string; transactionDate: string; description?: string; invoiceNumber?: string; paymentMethod: 'CASH' }) {
  return apiRequest<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function getReportSummary(token: string) { return apiRequest<ReportSummary>('/reports/summary', {}, token); }
export function getMonthlyReport(token: string, year = new Date().getFullYear()) { return apiRequest<MonthlyReport>(`/reports/monthly?year=${year}`, {}, token); }
export function getCategoryReport(token: string) { return apiRequest<CategoryReport>('/reports/by-category', {}, token); }
export function createUser(token: string, body: { email: string; password: string; role: 'ADMIN' | 'ACCOUNTANT' }) { return apiRequest<AuthUser>('/users', { method: 'POST', body: JSON.stringify(body) }, token); }
export function getUsers(token: string) { return apiRequest<User[]>('/users', {}, token); }
export function getAudit(token: string) { return apiRequest<{ items: AuditEntry[] }>('/audit?page=1&limit=50', {}, token); }
