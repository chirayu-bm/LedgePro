import { AccountType } from "@prisma/client";
import { getAccountRollup } from "./ledger.js";

function netBalance(type: AccountType, debit: number, credit: number): number {
  if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
    return debit - credit;
  }

  return credit - debit;
}

export async function getTrialBalanceReport(tenantId: string): Promise<{
  rows: Array<{ code: string; name: string; debit: number; credit: number }>;
  totals: { debit: number; credit: number };
}> {
  const accounts = await getAccountRollup(tenantId);

  const rows = accounts.map((account) => {
    const net = netBalance(account.type, account.debit, account.credit);

    if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
      return {
        code: account.code,
        name: account.name,
        debit: Math.max(net, 0),
        credit: Math.max(-net, 0)
      };
    }

    return {
      code: account.code,
      name: account.name,
      debit: Math.max(-net, 0),
      credit: Math.max(net, 0)
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      debit: acc.debit + row.debit,
      credit: acc.credit + row.credit
    }),
    { debit: 0, credit: 0 }
  );

  return { rows, totals };
}

export async function getProfitAndLossReport(tenantId: string): Promise<{
  revenue: number;
  expenses: number;
  netProfit: number;
}> {
  const accounts = await getAccountRollup(tenantId);

  const revenue = accounts
    .filter((account) => account.type === AccountType.REVENUE)
    .reduce((sum, account) => sum + (account.credit - account.debit), 0);

  const expenses = accounts
    .filter((account) => account.type === AccountType.EXPENSE)
    .reduce((sum, account) => sum + (account.debit - account.credit), 0);

  return {
    revenue,
    expenses,
    netProfit: revenue - expenses
  };
}

export async function getBalanceSheetReport(tenantId: string): Promise<{
  assets: number;
  liabilities: number;
  equity: number;
  retainedEarnings: number;
  equationDelta: number;
}> {
  const accounts = await getAccountRollup(tenantId);
  const profitAndLoss = await getProfitAndLossReport(tenantId);

  const assets = accounts
    .filter((account) => account.type === AccountType.ASSET)
    .reduce((sum, account) => sum + (account.debit - account.credit), 0);

  const liabilities = accounts
    .filter((account) => account.type === AccountType.LIABILITY)
    .reduce((sum, account) => sum + (account.credit - account.debit), 0);

  const equityBase = accounts
    .filter((account) => account.type === AccountType.EQUITY)
    .reduce((sum, account) => sum + (account.credit - account.debit), 0);

  const retainedEarnings = profitAndLoss.netProfit;
  const equity = equityBase + retainedEarnings;

  return {
    assets,
    liabilities,
    equity,
    retainedEarnings,
    equationDelta: assets - (liabilities + equity)
  };
}

export async function getCashFlowReport(tenantId: string): Promise<{
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}> {
  const accounts = await getAccountRollup(tenantId);
  const cashAccount = accounts.find((account) => account.code === "1000");

  if (!cashAccount) {
    return {
      cashIn: 0,
      cashOut: 0,
      netCashFlow: 0
    };
  }

  const cashIn = cashAccount.debit;
  const cashOut = cashAccount.credit;

  return {
    cashIn,
    cashOut,
    netCashFlow: cashIn - cashOut
  };
}
