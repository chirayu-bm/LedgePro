"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockInvoices } from "@/lib/constants";
import Table from "@/components/ui/Table";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function InvoicesPage() {
  const columns = [
    { key: "id", header: "Invoice ID" },
    { key: "client", header: "Client" },
    { key: "issuedDate", header: "Issued Date", render: (item: typeof mockInvoices[0]) => formatDate(item.issuedDate) },
    { key: "dueDate", header: "Due Date", render: (item: typeof mockInvoices[0]) => formatDate(item.dueDate) },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (item: typeof mockInvoices[0]) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (item: typeof mockInvoices[0]) => {
        const styles: Record<string, string> = {
          paid: "badge-paid",
          pending: "badge-pending",
          overdue: "badge-overdue",
        };
        return (
          <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", styles[item.status])}>
            {item.status}
          </span>
        );
      },
    },
  ];

  return (
    <DashboardLayout title="Invoices">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="text-base font-semibold text-text-primary">All Invoices</h3>
               <p className="text-xs text-text-muted mt-0.5">Manage billing and collections</p>
             </div>
           </div>
           
           <Table 
             data={mockInvoices} 
             columns={columns} 
             onRowClick={(item) => console.log("Clicked invoice", item.id)}
           />
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
