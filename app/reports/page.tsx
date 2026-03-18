"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import RevenueChart from "@/components/dashboard/RevenueChart";

export default function ReportsPage() {
  return (
    <DashboardLayout title="Reports">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <GlassCard className="p-6">
           <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">Financial Reports</h3>
           <p className="text-sm text-text-secondary mb-8">Generate, view, and export detailed reports of your financial operations.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
             {["Profit and Loss", "Balance Sheet", "Cash Flow Statement"].map((report) => (
               <div key={report} className="glass border border-glass-border p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center">
                 <span className="text-sm font-medium text-white">{report}</span>
               </div>
             ))}
           </div>
        </GlassCard>
        
        <RevenueChart />
      </div>
    </DashboardLayout>
  );
}
