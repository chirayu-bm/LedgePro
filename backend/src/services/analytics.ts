import { getDashboardSummary, getMonthlyRevenueExpense, listTransactions } from "./ledger.js";

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export async function getInsights(tenantId: string): Promise<{
  forecast: Array<{ month: string; projectedNetFlow: number }>;
  anomalies: Array<{ id: string; description: string; amount: number; reason: string }>;
  healthScore: number;
}> {
  const [summary, monthly, transactions] = await Promise.all([
    getDashboardSummary(tenantId),
    getMonthlyRevenueExpense(tenantId),
    listTransactions(tenantId)
  ]);

  const netFlows = monthly.map((row) => row.revenue - row.expenses);
  const recentNetFlows = netFlows.slice(-3);
  const projected = mean(recentNetFlows.length ? recentNetFlows : netFlows);

  const forecast = [1, 2, 3].map((offset) => ({
    month: `M+${offset}`,
    projectedNetFlow: Number((projected * (1 + offset * 0.02)).toFixed(2))
  }));

  const amounts = transactions.map((transaction) => transaction.amount);
  const avgAmount = mean(amounts);
  const stdAmount = standardDeviation(amounts);

  const anomalies = transactions
    .filter((transaction) => transaction.amount > avgAmount + stdAmount * 1.8)
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      reason: "Amount significantly above normal range"
    }));

  const profitability = summary.totalIncome > 0 ? (summary.netBalance / summary.totalIncome) * 100 : 0;
  const activityFactor = Math.min(summary.transactionCount * 2, 25);
  const healthScore = Math.max(0, Math.min(100, Math.round(45 + profitability * 0.4 + activityFactor)));

  return {
    forecast,
    anomalies,
    healthScore
  };
}
