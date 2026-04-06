import { parse } from "csv-parse/sync";
import { listTransactions } from "./ledger.js";

function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

function dayDifference(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.round((a.getTime() - b.getTime()) / msPerDay));
}

export async function previewReconciliation(tenantId: string, csvContent: string): Promise<{
  matched: Array<{ bankDescription: string; amount: number; date: string; transactionId: string }>;
  unmatchedBankRows: Array<{ bankDescription: string; amount: number; date: string }>;
  unmatchedSystemTransactions: Array<{ id: string; description: string; amount: number; date: string }>;
}> {
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Array<{ date: string; description: string; amount: string }>;

  const transactions = await listTransactions(tenantId);
  const remaining = new Set(transactions.map((tx) => tx.id));

  const matched: Array<{ bankDescription: string; amount: number; date: string; transactionId: string }> = [];
  const unmatchedBankRows: Array<{ bankDescription: string; amount: number; date: string }> = [];

  for (const row of rows) {
    const amount = Number(row.amount);
    const date = parseDate(row.date);

    const candidate = transactions.find((transaction) => {
      if (!remaining.has(transaction.id)) return false;
      const txDate = parseDate(transaction.date);
      return Math.abs(transaction.amount - amount) < 0.01 && dayDifference(txDate, date) <= 1;
    });

    if (!candidate) {
      unmatchedBankRows.push({
        bankDescription: row.description,
        amount,
        date: date.toISOString().slice(0, 10)
      });
      continue;
    }

    remaining.delete(candidate.id);
    matched.push({
      bankDescription: row.description,
      amount,
      date: date.toISOString().slice(0, 10),
      transactionId: candidate.id
    });
  }

  const unmatchedSystemTransactions = transactions
    .filter((transaction) => remaining.has(transaction.id))
    .map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date
    }));

  return {
    matched,
    unmatchedBankRows,
    unmatchedSystemTransactions
  };
}
