"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import GlassCard from "@/components/ui/GlassCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createTransaction } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

type TransactionIntent = "topup" | "withdraw" | "transfer" | "general";

const intentConfig: Record<TransactionIntent, { title: string; subtitle: string; defaultType: "income" | "expense"; defaultDescription: string }> = {
  general: {
    title: "Create Transaction",
    subtitle: "Posts a balanced double-entry journal to the backend ledger.",
    defaultType: "income",
    defaultDescription: ""
  },
  topup: {
    title: "Top Up Wallet",
    subtitle: "Record a wallet funding movement as an income entry.",
    defaultType: "income",
    defaultDescription: "Wallet top up"
  },
  withdraw: {
    title: "Withdraw Funds",
    subtitle: "Record a withdrawal movement as an expense entry.",
    defaultType: "expense",
    defaultDescription: "Wallet withdrawal"
  },
  transfer: {
    title: "Transfer Out",
    subtitle: "Record transfer-out movement with a dedicated transfer category.",
    defaultType: "expense",
    defaultDescription: "Transfer out"
  }
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const { user, transactions, addTransaction, transactionSearchQuery, setTransactionSearchQuery } = useAppStore();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("1000");
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Operations");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<TransactionIntent>("general");

  const rawAction = searchParams.get("action");
  const configuredType = searchParams.get("type");
  const configuredCategory = searchParams.get("category");

  useEffect(() => {
    const resolvedIntent: TransactionIntent = rawAction === "topup" || rawAction === "withdraw" || rawAction === "transfer" ? rawAction : "general";
    const nextIntent = intentConfig[resolvedIntent];

    setIntent(resolvedIntent);

    if (resolvedIntent !== "general") {
      setTransactionSearchQuery("");
    }

    setType(configuredType === "expense" ? "expense" : nextIntent.defaultType);
    setCategory(configuredCategory?.trim() ? configuredCategory.trim() : resolvedIntent === "general" ? "Operations" : resolvedIntent === "topup" ? "Top Up" : resolvedIntent === "withdraw" ? "Withdrawal" : "Transfer Out");
    setDescription(nextIntent.defaultDescription);
    setAmount("1000");
    setError(null);
  }, [configuredCategory, configuredType, rawAction, setTransactionSearchQuery]);

  const normalizedSearchQuery = transactionSearchQuery.trim().toLowerCase();

  const matchedTransactions = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return transactions.filter((tx) => {
      const amountText = String(tx.amount);
      const reference = tx.reference?.toLowerCase() ?? "";
      const kind = tx.kind?.toLowerCase() ?? "";
      const createdBy = tx.createdBy?.toLowerCase() ?? "";
      const lineMatch = (tx.lines ?? []).some((line) => {
        const memo = line.memo?.toLowerCase() ?? "";
        return (
          line.accountCode.toLowerCase().includes(normalizedSearchQuery) ||
          line.accountName.toLowerCase().includes(normalizedSearchQuery) ||
          memo.includes(normalizedSearchQuery)
        );
      });

      return (
        tx.description.toLowerCase().includes(normalizedSearchQuery) ||
        tx.category.toLowerCase().includes(normalizedSearchQuery) ||
        tx.id.toLowerCase().includes(normalizedSearchQuery) ||
        tx.date.toLowerCase().includes(normalizedSearchQuery) ||
        amountText.includes(normalizedSearchQuery) ||
        reference.includes(normalizedSearchQuery) ||
        kind.includes(normalizedSearchQuery) ||
        createdBy.includes(normalizedSearchQuery) ||
        lineMatch
      );
    });
  }, [normalizedSearchQuery, transactions]);

  const handleCreateTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const amountNumber = Number(amount);

      if (!description.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0) {
        throw new Error("Enter valid transaction details.");
      }

      const created = await createTransaction(
        {
          description: description.trim(),
          amount: amountNumber,
          type,
          category: category.trim() || undefined,
        },
        user?.role
      );

      if (created) {
        addTransaction(created);
        setDescription("");
        setAmount("1000");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-36 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />

        {!normalizedSearchQuery && (
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-text-primary">{intentConfig[intent].title}</h3>
            <p className="mt-1 text-xs text-text-muted">{intentConfig[intent].subtitle}</p>

            <form onSubmit={handleCreateTransaction} className="mt-5 grid gap-4 md:grid-cols-2">
              <Input
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Consulting revenue"
                required
              />

              <Input
                label="Amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-text-secondary font-medium">Type</label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as "income" | "expense")}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <Input
                label="Category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Operations"
              />

              <div className="md:col-span-2 flex items-center justify-between gap-3">
                {error ? <p className="text-sm text-accent-red">{error}</p> : <span className="text-xs text-text-muted">Requires Admin or Accountant role.</span>}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Posting..." : "Post Transaction"}
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {normalizedSearchQuery && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Filtering transactions for: <span className="font-semibold text-white">&quot;{transactionSearchQuery}&quot;</span>
              </p>
              <button
                type="button"
                onClick={() => setTransactionSearchQuery("")}
                className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white"
              >
                Clear Filter
              </button>
            </div>
          </GlassCard>
        )}

        {normalizedSearchQuery && (
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Transaction Details</h3>
              <p className="text-xs text-text-muted">{matchedTransactions.length} match{matchedTransactions.length === 1 ? "" : "es"}</p>
            </div>

            {matchedTransactions.length === 0 ? (
              <p className="text-sm text-text-muted">No transaction details found for this name.</p>
            ) : (
              <div className="space-y-4">
                {matchedTransactions.slice(0, 8).map((tx) => (
                  <div key={tx.id} className="rounded-2xl border border-glass-border bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{tx.description}</p>
                        <p className="mt-1 text-xs text-text-muted">{tx.id}</p>
                      </div>
                      <p className={`text-sm font-semibold ${tx.type === "credit" ? "text-accent-green" : "text-accent-red"}`}>
                        {tx.type === "credit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <p className="text-xs text-text-secondary">Date: <span className="text-white">{formatDate(tx.date)}</span></p>
                      <p className="text-xs text-text-secondary">Category: <span className="text-white">{tx.category}</span></p>
                      <p className="text-xs text-text-secondary">Type: <span className="text-white capitalize">{tx.kind ?? (tx.type === "credit" ? "income" : "expense")}</span></p>
                      <p className="text-xs text-text-secondary">Status: <span className="text-white capitalize">{tx.status}</span></p>
                      <p className="text-xs text-text-secondary">Reference: <span className="text-white">{tx.reference ?? "-"}</span></p>
                      <p className="text-xs text-text-secondary">Created By: <span className="text-white">{tx.createdBy ?? "System"}</span></p>
                      <p className="text-xs text-text-secondary">Debit Total: <span className="text-white">{formatCurrency(tx.debitTotal ?? tx.amount)}</span></p>
                      <p className="text-xs text-text-secondary">Credit Total: <span className="text-white">{formatCurrency(tx.creditTotal ?? tx.amount)}</span></p>
                      <p className="text-xs text-text-secondary">Balanced: <span className={(tx.isBalanced ?? true) ? "text-accent-green" : "text-accent-red"}>{(tx.isBalanced ?? true) ? "Yes" : "No"}</span></p>
                    </div>

                    {tx.lines?.length ? (
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[640px] w-full text-left">
                          <thead>
                            <tr className="border-b border-glass-border/70 text-xs uppercase tracking-[0.08em] text-text-muted">
                              <th className="px-2 py-2">Account</th>
                              <th className="px-2 py-2">Debit</th>
                              <th className="px-2 py-2">Credit</th>
                              <th className="px-2 py-2">Memo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.lines.map((line) => (
                              <tr key={line.id} className="border-b border-glass-border/30 text-xs text-text-secondary last:border-b-0">
                                <td className="px-2 py-2">
                                  <p className="text-white">{line.accountName}</p>
                                  <p className="text-[11px] text-text-muted">{line.accountCode}</p>
                                </td>
                                <td className="px-2 py-2 text-accent-red">{line.debit ? formatCurrency(line.debit) : "-"}</td>
                                <td className="px-2 py-2 text-accent-green">{line.credit ? formatCurrency(line.credit) : "-"}</td>
                                <td className="px-2 py-2">{line.memo ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        <TransactionsTable searchQuery={transactionSearchQuery} />
      </div>
    </DashboardLayout>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Transactions">
          <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
            <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-accent-green/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-36 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />

            <GlassCard className="p-6">
              <p className="text-sm text-text-muted">Loading transactions...</p>
            </GlassCard>
          </div>
        </DashboardLayout>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
