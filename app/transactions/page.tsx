"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import TransactionsTable from "@/components/dashboard/TransactionsTable";

export default function TransactionsPage() {
  return (
    <DashboardLayout title="Transactions">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <TransactionsTable />
      </div>
    </DashboardLayout>
  );
}
