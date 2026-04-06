"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import GlassCard from "@/components/ui/GlassCard";
import { fetchExpenseBreakdown, fetchInsights } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const { user } = useAppStore();
  const [expenseData, setExpenseData] = useState<Array<{ category: string; amount: number; fill: string }>>([]);
  const [insights, setInsights] = useState<{
    forecast: Array<{ month: string; projectedNetFlow: number }>;
    anomalies: Array<{ id: string; description: string; amount: number; reason: string }>;
    healthScore: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [expenseBreakdown, analytics] = await Promise.all([
          fetchExpenseBreakdown(user?.role),
          fetchInsights(user?.role)
        ]);

        if (!cancelled) {
          setExpenseData(expenseBreakdown);
          setInsights(analytics);
        }
      } catch {
        if (!cancelled) {
          setExpenseData([]);
          setInsights(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  return (
    <DashboardLayout title="Analytics">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <div className="pointer-events-none absolute -left-20 top-14 h-64 w-64 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-28 h-72 w-72 rounded-full bg-[#7ec7ff]/10 blur-3xl" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Financial Health Score</p>
            <p className="mt-2 text-2xl font-semibold text-white">{insights?.healthScore ?? 0}/100</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Next Month Projection</p>
            <p className={`mt-2 text-2xl font-semibold ${(insights?.forecast[0]?.projectedNetFlow ?? 0) < 0 ? "text-accent-red" : "text-accent-green"}`}>
              {formatCurrency(insights?.forecast[0]?.projectedNetFlow ?? 0)}
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Flagged Anomalies</p>
            <p className="mt-2 text-2xl font-semibold text-white">{insights?.anomalies.length ?? 0}</p>
          </GlassCard>
        </div>

        <ExpenseChart data={expenseData} />
      </div>
    </DashboardLayout>
  );
}
