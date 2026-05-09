"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { formatCurrency } from "@/lib/utils";
import { fetchBalanceSheet, fetchCashFlow, fetchDashboard, fetchProfitAndLoss } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";

export default function ReportsPage() {
  const { user } = useAppStore();
  const [profitLoss, setProfitLoss] = useState<{ revenue: number; expenses: number; netProfit: number } | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<{ assets: number; liabilities: number; equity: number } | null>(null);
  const [cashFlow, setCashFlow] = useState<{ cashIn: number; cashOut: number; netCashFlow: number } | null>(null);
  const [monthly, setMonthly] = useState<Array<{ month: string; revenue: number; expenses: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [pl, bs, cf, dashboard] = await Promise.all([
          fetchProfitAndLoss(user?.role),
          fetchBalanceSheet(user?.role),
          fetchCashFlow(user?.role),
          fetchDashboard(user?.role)
        ]);

        if (!cancelled) {
          setProfitLoss(pl);
          setBalanceSheet(bs);
          setCashFlow(cf);
          setMonthly(dashboard.monthly);
        }
      } catch {
        if (!cancelled) {
          setProfitLoss(null);
          setBalanceSheet(null);
          setCashFlow(null);
          setMonthly([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  return (
    <DashboardLayout title="Reports">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-[#66b3ff]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />

        <GlassCard className="p-6">
           <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">Financial Reports</h3>
           <p className="text-sm text-text-secondary mb-8">Generate, view, and export detailed reports of your financial operations.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
             {[
               {
                 label: "Profit and Loss",
                 value: profitLoss ? formatCurrency(profitLoss.netProfit) : "--",
                 tone: profitLoss ? (profitLoss.netProfit < 0 ? "text-accent-red" : "text-accent-green") : "text-text-muted"
               },
               {
                 label: "Balance Sheet",
                 value: balanceSheet ? formatCurrency(balanceSheet.assets) : "--",
                 tone: "text-text-muted"
               },
               {
                 label: "Cash Flow Statement",
                 value: cashFlow ? formatCurrency(cashFlow.netCashFlow) : "--",
                 tone: cashFlow ? (cashFlow.netCashFlow < 0 ? "text-accent-red" : "text-accent-green") : "text-text-muted"
               }
             ].map((report) => (
               <div key={report.label} className="glass border border-glass-border p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center">
                 <span className="text-sm font-medium text-white">{report.label}</span>
                 <p className={`mt-2 text-xs ${report.tone}`}>{report.value}</p>
               </div>
             ))}
           </div>
        </GlassCard>
        
        <RevenueChart data={monthly} />
      </div>
    </DashboardLayout>
  );
}
