"use client";

import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import SkeletonCard from "@/components/ui/SkeletonCard";

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

export default function TransactionsTable() {
  const { transactions, isLoading, error, setError } = useAppStore();

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
            Last {transactions.length} transactions
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
            {transactions.map((tx, idx) => (
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
                      : "text-text-primary"
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
