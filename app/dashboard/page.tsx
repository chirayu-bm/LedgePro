"use client";

import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import HeroCard from "@/components/dashboard/HeroCard";
import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";

const kpiData = [
  {
    title: "Total Revenue",
    value: 284500,
    trend: 12.5,
    icon: DollarSign,
    isCurrency: true,
  },
  {
    title: "Total Expenses",
    value: 128400,
    trend: -3.2,
    icon: ArrowDownLeft,
    isCurrency: true,
  },
  {
    title: "Net Profit",
    value: 156100,
    trend: 18.7,
    icon: ArrowUpRight,
    isCurrency: true,
  },
  {
    title: "Transactions",
    value: 1284,
    trend: 5.3,
    icon: CreditCard,
    isCurrency: false,
  },
];

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-12 pt-6 lg:pt-8 pb-2 max-w-[1400px] mx-auto relative z-10">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-[100px] -z-10 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-green/5 rounded-full blur-[100px] -z-10 translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        {/* Hero */}
        <HeroCard />

        {/* KPI Cards */}
        <section className="space-y-6">
          <div className="px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
              Key Metrics
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {kpiData.map((kpi, idx) => (
              <KPICard key={kpi.title} {...kpi} index={idx} />
            ))}
          </div>
        </section>

        {/* Charts */}
        <section className="space-y-6 pt-8 lg:pt-10 border-t border-glass-border/50">
          <div className="px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
              Performance Insights
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <RevenueChart />
            <ExpenseChart />
          </div>
        </section>

        {/* Transactions Table */}
        <div className="pt-2">
          <TransactionsTable />
        </div>
      </div>
    </DashboardLayout>
  );
}
