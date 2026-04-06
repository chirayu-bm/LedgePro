const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "demo-sme";
const ACTIVE_TENANT_SLUG_KEY = "ledgepro.activeTenantSlug";
const ACTIVE_USER_EMAIL_KEY = "ledgepro.activeUserEmail";

type UserRoleHeader = "ADMIN" | "ACCOUNTANT" | "VIEWER";

export type AppRole = "admin" | "accountant" | "viewer";

function toAppRole(role?: string): AppRole {
  const normalized = (role ?? "viewer").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "accountant") return "accountant";
  return "viewer";
}

function readStorageValue(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null): void {
  if (typeof window === "undefined") return;

  try {
    if (!value) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and continue with request defaults.
  }
}

export function getActiveTenantSlug(): string {
  const stored = readStorageValue(ACTIVE_TENANT_SLUG_KEY)?.trim();
  return stored || DEFAULT_TENANT_SLUG;
}

export function setActiveTenantSlug(slug: string | null): void {
  const normalized = (slug ?? "").trim();
  writeStorageValue(ACTIVE_TENANT_SLUG_KEY, normalized || null);
}

export function setActiveUserEmail(email: string | null): void {
  const normalized = (email ?? "").trim().toLowerCase();
  writeStorageValue(ACTIVE_USER_EMAIL_KEY, normalized || null);
}

function getActiveUserEmail(): string | null {
  const stored = readStorageValue(ACTIVE_USER_EMAIL_KEY)?.trim().toLowerCase();
  return stored || null;
}

function toRoleHeader(role?: string): UserRoleHeader {
  const normalized = (role ?? "viewer").toUpperCase();
  if (normalized === "ACCOUNTANT") return "ACCOUNTANT";
  if (normalized === "VIEWER") return "VIEWER";
  return "ADMIN";
}

async function request<T>(path: string, options: RequestInit = {}, role?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-tenant-slug", getActiveTenantSlug());
  headers.set("x-user-role", toRoleHeader(role));

  const activeUserEmail = getActiveUserEmail();
  if (activeUserEmail) {
    headers.set("x-user-email", activeUserEmail);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) message = errorBody.message;
    } catch {
      // Ignore parsing errors and keep default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type LedgerTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed";
  date: string;
  category: string;
  reference?: string | null;
  kind?: "income" | "expense" | "transfer" | "adjustment";
  createdAt?: string;
  createdBy?: string | null;
  debitTotal?: number;
  creditTotal?: number;
  isBalanced?: boolean;
  lines?: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    memo: string | null;
  }>;
};

export type InvoiceRow = {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
};

export type LedgerAccount = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  normalSide: "DEBIT" | "CREDIT";
  isActive: boolean;
  isSystem: boolean;
};

export type DashboardSummaryResponse = {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    transactionCount: number;
  };
  monthly: Array<{ month: string; revenue: number; expenses: number }>;
  expenseBreakdown: Array<{ category: string; amount: number; fill: string }>;
  recentTransactions: LedgerTransaction[];
};

export type GoalItem = {
  id: string;
  label: string;
  description: string | null;
  current: number;
  target: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceSummary = {
  tenantId: string;
  slug: string;
  name: string;
  baseCurrency: string;
  role: AppRole;
};

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
};

export async function fetchDashboard(role?: string): Promise<DashboardSummaryResponse> {
  const response = await request<{ summary: DashboardSummaryResponse["summary"]; monthly: DashboardSummaryResponse["monthly"]; expenseBreakdown: DashboardSummaryResponse["expenseBreakdown"]; recentTransactions: LedgerTransaction[] }>("/api/dashboard", {}, role);
  return response;
}

export async function fetchTransactions(role?: string): Promise<LedgerTransaction[]> {
  const response = await request<{ data: LedgerTransaction[] }>("/api/transactions", {}, role);
  return response.data;
}

export async function fetchGoals(role?: string): Promise<GoalItem[]> {
  const response = await request<{ data: GoalItem[] }>("/api/goals", {}, role);
  return response.data;
}

export async function createGoal(input: {
  label: string;
  description?: string;
  current?: number;
  target: number;
}, role?: string): Promise<GoalItem> {
  const response = await request<{ data: GoalItem }>(
    "/api/goals",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return response.data;
}

export async function updateGoal(goalId: string, input: {
  label?: string;
  description?: string;
  current?: number;
  target?: number;
}, role?: string): Promise<GoalItem> {
  const response = await request<{ data: GoalItem }>(
    `/api/goals/${goalId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    },
    role
  );

  return response.data;
}

export async function removeGoal(goalId: string, role?: string): Promise<void> {
  await request<void>(
    `/api/goals/${goalId}`,
    {
      method: "DELETE"
    },
    role
  );
}

export async function createTransaction(input: {
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  date?: string;
}, role?: string): Promise<LedgerTransaction | null> {
  const response = await request<{ data: LedgerTransaction | null }>(
    "/api/transactions",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return response.data;
}

export async function fetchInvoices(role?: string): Promise<InvoiceRow[]> {
  const response = await request<{ data: InvoiceRow[] }>("/api/invoices", {}, role);
  return response.data;
}

export async function createInvoice(input: {
  clientName: string;
  subtotal: number;
  taxRate?: number;
  dueDate: string;
  issuedDate?: string;
  currency?: string;
}, role?: string): Promise<{ id: string; invoiceNumber: string }> {
  const response = await request<{ data: { id: string; invoiceNumber: string } }>(
    "/api/invoices",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return response.data;
}

export async function fetchAccounts(role?: string): Promise<LedgerAccount[]> {
  const response = await request<{ data: LedgerAccount[] }>("/api/accounts", {}, role);
  return response.data;
}

export async function createAccount(input: {
  code: string;
  name: string;
  type: LedgerAccount["type"];
  normalSide?: LedgerAccount["normalSide"];
  isActive?: boolean;
}, role?: string): Promise<LedgerAccount> {
  const response = await request<{ data: LedgerAccount }>(
    "/api/accounts",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return response.data;
}

export async function fetchProfitAndLoss(role?: string): Promise<{ revenue: number; expenses: number; netProfit: number }> {
  const response = await request<{ data: { revenue: number; expenses: number; netProfit: number } }>("/api/reports/profit-loss", {}, role);
  return response.data;
}

export async function fetchTrialBalance(role?: string): Promise<{ rows: Array<{ code: string; name: string; debit: number; credit: number }>; totals: { debit: number; credit: number } }> {
  const response = await request<{ data: { rows: Array<{ code: string; name: string; debit: number; credit: number }>; totals: { debit: number; credit: number } } }>("/api/reports/trial-balance", {}, role);
  return response.data;
}

export async function fetchBalanceSheet(role?: string): Promise<{ assets: number; liabilities: number; equity: number; retainedEarnings: number; equationDelta: number }> {
  const response = await request<{ data: { assets: number; liabilities: number; equity: number; retainedEarnings: number; equationDelta: number } }>("/api/reports/balance-sheet", {}, role);
  return response.data;
}

export async function fetchCashFlow(role?: string): Promise<{ cashIn: number; cashOut: number; netCashFlow: number }> {
  const response = await request<{ data: { cashIn: number; cashOut: number; netCashFlow: number } }>("/api/reports/cash-flow", {}, role);
  return response.data;
}

export async function fetchInsights(role?: string): Promise<{ forecast: Array<{ month: string; projectedNetFlow: number }>; anomalies: Array<{ id: string; description: string; amount: number; reason: string }>; healthScore: number }> {
  const response = await request<{ data: { forecast: Array<{ month: string; projectedNetFlow: number }>; anomalies: Array<{ id: string; description: string; amount: number; reason: string }>; healthScore: number } }>("/api/analytics/insights", {}, role);
  return response.data;
}

export async function fetchExpenseBreakdown(role?: string): Promise<Array<{ category: string; amount: number; fill: string }>> {
  const dashboard = await fetchDashboard(role);
  return dashboard.expenseBreakdown;
}

export async function fetchWorkspaces(role?: string): Promise<WorkspaceSummary[]> {
  const response = await request<{ data: Array<{ tenantId: string; slug: string; name: string; baseCurrency: string; role: string }> }>("/api/workspaces", {}, role);
  return response.data.map((workspace) => ({
    ...workspace,
    role: toAppRole(workspace.role)
  }));
}

export async function createWorkspace(input: {
  name: string;
  slug?: string;
  baseCurrency?: string;
}, role?: string): Promise<WorkspaceSummary> {
  const response = await request<{ data: { tenantId: string; slug: string; name: string; baseCurrency: string; role: string } }>(
    "/api/workspaces",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return {
    ...response.data,
    role: toAppRole(response.data.role)
  };
}

export async function fetchWorkspaceMembers(role?: string): Promise<WorkspaceMember[]> {
  const response = await request<{ data: Array<{ id: string; name: string; email: string; role: string; createdAt: string }> }>(
    "/api/workspaces/members",
    {},
    role
  );

  return response.data.map((member) => ({
    ...member,
    role: toAppRole(member.role)
  }));
}

export async function inviteWorkspaceMember(input: {
  email: string;
  name: string;
  role: AppRole;
  password?: string;
}, role?: string): Promise<WorkspaceMember> {
  const response = await request<{ data: { id: string; name: string; email: string; role: string; createdAt: string } }>(
    "/api/workspaces/invite",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    role
  );

  return {
    ...response.data,
    role: toAppRole(response.data.role)
  };
}

export async function fetchAuditLogs(role?: string): Promise<Array<{ id: string; action: string; entity: string; entityId: string; createdAt: string }>> {
  const response = await request<{ data: Array<{ id: string; action: string; entity: string; entityId: string; createdAt: string }> }>("/api/audit-logs", {}, role);
  return response.data;
}

export async function previewBankReconciliation(csvContent: string, role?: string): Promise<{
  matched: Array<{ bankDescription: string; amount: number; date: string; transactionId: string }>;
  unmatchedBankRows: Array<{ bankDescription: string; amount: number; date: string }>;
  unmatchedSystemTransactions: Array<{ id: string; description: string; amount: number; date: string }>;
}> {
  const response = await request<{
    data: {
      matched: Array<{ bankDescription: string; amount: number; date: string; transactionId: string }>;
      unmatchedBankRows: Array<{ bankDescription: string; amount: number; date: string }>;
      unmatchedSystemTransactions: Array<{ id: string; description: string; amount: number; date: string }>;
    };
  }>(
    "/api/reconciliation/preview",
    {
      method: "POST",
      body: JSON.stringify({ csvContent })
    },
    role
  );

  return response.data;
}
