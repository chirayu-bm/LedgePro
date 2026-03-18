"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseChart from "@/components/dashboard/ExpenseChart";

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Analytics">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <ExpenseChart />
      </div>
    </DashboardLayout>
  );
}
