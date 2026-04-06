"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { fetchTransactions } from "@/lib/api-client";

interface TransactionsTableProps {
  searchQuery?: string;
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    completed: "badge-completed",
    pending: "badge-pending",
    failed: "badge-failed",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-lg text-xs font-medium capitalize",
        styles[status] ?? "badge-pending"
      )}
    >
      {status}
    </span>
  );
};

export default function TransactionsTable({ searchQuery = "" }: TransactionsTableProps) {
  const { transactions, isLoading, error, setError, setLoading, setTransactions, user } = useAppStore();
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTransactions = normalizedSearchQuery
    ? transactions.filter((tx) => {
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
      })
    : transactions;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions(user?.role);
        if (!cancelled) {
          setTransactions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load transactions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [setError, setLoading, setTransactions, user?.role]);

  if (isLoading) {
    return <SkeletonCard lines={6} className="rounded-2xl" />;
  }

  if (error) {
    return (
      <SkeletonCard
        state="error"
        errorMessage={error}
        onRetry={() => setError(null)}
        className="rounded-2xl"
      />
    );
  }

  if (!transactions.length) {
    return (
      <SkeletonCard
        state="empty"
        emptyMessage="No transactions yet"
        className="rounded-2xl"
      />
    );
  }

  if (!filteredTransactions.length) {
    return (
      <SkeletonCard
        state="empty"
        emptyMessage={`No transactions found for "${searchQuery}"`}
        className="rounded-2xl"
      />
    );
  }

  return (
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="p-6 lg:p-8 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Recent Transactions
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        <button className="text-xs text-accent-orange hover:text-accent-orange/80 transition-colors font-medium cursor-pointer">
          View All →
        </button>
      </div>

      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                Transaction
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                Category
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                Date
              </th>
              <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                Amount
              </th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx, idx) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="border-b border-glass-border/50 hover:bg-glass-hover transition-all duration-300 cursor-pointer"
              >
                <td className="px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {tx.description}
                    </p>
                    <p className="text-xs text-text-muted">{tx.id}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-text-secondary">
                  {tx.category}
                </td>
                <td className="px-4 py-3.5 text-sm text-text-secondary">
                  {formatDate(tx.date)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3.5 text-sm font-medium text-right",
                    tx.type === "credit"
                      ? "text-accent-green"
                      : "text-accent-red"
                  )}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {statusBadge(tx.status)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
