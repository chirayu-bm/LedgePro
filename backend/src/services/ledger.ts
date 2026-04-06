import { AccountType, EntryKind, EntryStatus, Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { createAuditLog } from "../lib/audit.js";

const DECIMAL_ZERO = new Prisma.Decimal(0);

const EXPENSE_COLORS = ["#FF7A00", "#FF9A40", "#FFB980", "#22C55E", "#4ADE80", "rgba(255,255,255,0.2)"];

export type TransactionInput = {
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  date?: string;
  reference?: string;
  createdById?: string;
};

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function monthKey(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

async function getSystemAccounts(tenantId: string): Promise<{ cashId: string; revenueId: string; expenseId: string }> {
  const accounts = await prisma.account.findMany({
    where: {
      tenantId,
      code: { in: ["1000", "4000", "5000"] }
    },
    select: { id: true, code: true }
  });

  const cash = accounts.find((account) => account.code === "1000");
  const revenue = accounts.find((account) => account.code === "4000");
  const expense = accounts.find((account) => account.code === "5000");

  if (!cash || !revenue || !expense) {
    throw new Error("Required system accounts are missing for tenant");
  }

  return {
    cashId: cash.id,
    revenueId: revenue.id,
    expenseId: expense.id
  };
}

export async function createLedgerTransaction(tenantId: string, input: TransactionInput): Promise<{ id: string }> {
  const amount = new Prisma.Decimal(input.amount);

  if (amount.lte(0)) {
    throw new Error("Amount must be greater than zero");
  }

  const { cashId, revenueId, expenseId } = await getSystemAccounts(tenantId);

  const entryDate = input.date ? new Date(input.date) : new Date();
  const category = input.category ?? (input.type === "income" ? "Revenue" : "Operating Expense");

  const createdEntry = await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        tenantId,
        entryDate,
        description: input.description,
        reference: input.reference,
        kind: input.type === "income" ? EntryKind.INCOME : EntryKind.EXPENSE,
        status: EntryStatus.POSTED,
        category,
        createdById: input.createdById
      }
    });

    if (input.type === "income") {
      await tx.journalLine.createMany({
        data: [
          {
            entryId: entry.id,
            accountId: cashId,
            debit: amount,
            credit: DECIMAL_ZERO,
            memo: "Cash received"
          },
          {
            entryId: entry.id,
            accountId: revenueId,
            debit: DECIMAL_ZERO,
            credit: amount,
            memo: "Revenue recognized"
          }
        ]
      });
    } else {
      await tx.journalLine.createMany({
        data: [
          {
            entryId: entry.id,
            accountId: expenseId,
            debit: amount,
            credit: DECIMAL_ZERO,
            memo: "Expense recognized"
          },
          {
            entryId: entry.id,
            accountId: cashId,
            debit: DECIMAL_ZERO,
            credit: amount,
            memo: "Cash paid"
          }
        ]
      });
    }

    return entry;
  });

  await createAuditLog({
    tenantId,
    userId: input.createdById,
    action: "TRANSACTION_CREATED",
    entity: "journal_entry",
    entityId: createdEntry.id,
    metadata: {
      type: input.type,
      amount: input.amount,
      category
    }
  });

  return { id: createdEntry.id };
}

export async function listTransactions(tenantId: string): Promise<Array<{
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed";
  date: string;
  category: string;
  reference: string | null;
  kind: "income" | "expense" | "transfer" | "adjustment";
  createdAt: string;
  createdBy: string | null;
  debitTotal: number;
  creditTotal: number;
  isBalanced: boolean;
  lines: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    memo: string | null;
  }>;
}>> {
  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId,
      status: EntryStatus.POSTED,
      kind: { in: [EntryKind.INCOME, EntryKind.EXPENSE] }
    },
    include: {
      createdBy: {
        select: { name: true }
      },
      lines: {
        include: {
          account: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: { entryDate: "desc" },
    take: 100
  });

  return entries.map((entry) => {
    const debitTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.debit), 0);
    const creditTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.credit), 0);
    const amount = Math.max(debitTotal, creditTotal);
    const isIncome = entry.kind === EntryKind.INCOME;
    const kind =
      entry.kind === EntryKind.INCOME
        ? "income"
        : entry.kind === EntryKind.EXPENSE
          ? "expense"
          : entry.kind === EntryKind.TRANSFER
            ? "transfer"
            : "adjustment";

    return {
      id: entry.id,
      description: entry.description,
      amount,
      type: isIncome ? "credit" : "debit",
      status: "completed",
      date: entry.entryDate.toISOString().slice(0, 10),
      category: entry.category ?? (isIncome ? "Revenue" : "Expense"),
      reference: entry.reference ?? null,
      kind,
      createdAt: entry.createdAt.toISOString(),
      createdBy: entry.createdBy?.name ?? null,
      debitTotal,
      creditTotal,
      isBalanced: Math.abs(debitTotal - creditTotal) < 0.0001,
      lines: entry.lines.map((line) => ({
        id: line.id,
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        debit: toNumber(line.debit),
        credit: toNumber(line.credit),
        memo: line.memo ?? null
      }))
    };
  });
}

export async function getDashboardSummary(tenantId: string): Promise<{
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}> {
  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId,
      status: EntryStatus.POSTED,
      kind: { in: [EntryKind.INCOME, EntryKind.EXPENSE] }
    },
    include: { lines: true }
  });

  let totalIncome = 0;
  let totalExpense = 0;

  for (const entry of entries) {
    const debitTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.debit), 0);
    const creditTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.credit), 0);
    const amount = Math.max(debitTotal, creditTotal);

    if (entry.kind === EntryKind.INCOME) totalIncome += amount;
    if (entry.kind === EntryKind.EXPENSE) totalExpense += amount;
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionCount: entries.length
  };
}

export async function getMonthlyRevenueExpense(tenantId: string): Promise<Array<{ month: string; revenue: number; expenses: number }>> {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId,
      status: EntryStatus.POSTED,
      entryDate: { gte: start },
      kind: { in: [EntryKind.INCOME, EntryKind.EXPENSE] }
    },
    include: { lines: true },
    orderBy: { entryDate: "asc" }
  });

  const seedMonths = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      month: monthKey(date),
      revenue: 0,
      expenses: 0
    };
  });

  const map = new Map(seedMonths.map((row) => [row.month, row]));

  for (const entry of entries) {
    const key = monthKey(entry.entryDate);
    const target = map.get(key);
    if (!target) continue;

    const debitTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.debit), 0);
    const creditTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.credit), 0);
    const amount = Math.max(debitTotal, creditTotal);

    if (entry.kind === EntryKind.INCOME) target.revenue += amount;
    if (entry.kind === EntryKind.EXPENSE) target.expenses += amount;
  }

  return seedMonths;
}

export async function getExpenseBreakdown(tenantId: string): Promise<Array<{ category: string; amount: number; fill: string }>> {
  const expenses = await prisma.journalEntry.findMany({
    where: {
      tenantId,
      status: EntryStatus.POSTED,
      kind: EntryKind.EXPENSE
    },
    include: { lines: true }
  });

  const categoryMap = new Map<string, number>();

  for (const entry of expenses) {
    const debitTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.debit), 0);
    const creditTotal = entry.lines.reduce((sum, line) => sum + toNumber(line.credit), 0);
    const amount = Math.max(debitTotal, creditTotal);
    const category = entry.category ?? "Other";

    categoryMap.set(category, (categoryMap.get(category) ?? 0) + amount);
  }

  return Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, amount], index) => ({
      category,
      amount,
      fill: EXPENSE_COLORS[index] ?? EXPENSE_COLORS[EXPENSE_COLORS.length - 1]
    }));
}

export async function getAccountRollup(tenantId: string): Promise<Array<{
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}>> {
  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: "asc" }
  });

  const lines = await prisma.journalLine.findMany({
    where: {
      entry: {
        tenantId,
        status: EntryStatus.POSTED
      }
    },
    include: { entry: true }
  });

  const map = new Map(
    accounts.map((account) => [
      account.id,
      {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: 0,
        credit: 0
      }
    ])
  );

  for (const line of lines) {
    const row = map.get(line.accountId);
    if (!row) continue;
    row.debit += toNumber(line.debit);
    row.credit += toNumber(line.credit);
  }

  return Array.from(map.values());
}
