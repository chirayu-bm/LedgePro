"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table from "@/components/ui/Table";
import GlassCard from "@/components/ui/GlassCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { createInvoice, fetchInvoices, type InvoiceRow } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";

export default function InvoicesPage() {
  const { user } = useAppStore();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [clientName, setClientName] = useState("New Client");
  const [subtotal, setSubtotal] = useState("5000");
  const [taxRate, setTaxRate] = useState("18");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchInvoices(user?.role);
        if (!cancelled) {
          setRows(data);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const submitInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const subtotalNumber = Number(subtotal);
      const taxRateNumber = Number(taxRate);
      const dueDateValue = dueDate ? new Date(dueDate) : null;

      if (!clientName.trim() || !Number.isFinite(subtotalNumber) || subtotalNumber <= 0) {
        throw new Error("Enter valid invoice details.");
      }

      if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
        throw new Error("Select a valid due date.");
      }

      await createInvoice(
        {
          clientName: clientName.trim(),
          subtotal: subtotalNumber,
          taxRate: Number.isFinite(taxRateNumber) ? taxRateNumber : 0,
          dueDate: dueDateValue.toISOString(),
        },
        user?.role
      );

      const refreshed = await fetchInvoices(user?.role);
      setRows(refreshed);
      setClientName("New Client");
      setSubtotal("5000");
      setTaxRate("18");
      setDueDate("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    { key: "id", header: "Invoice ID" },
    { key: "client", header: "Client" },
    { key: "issuedDate", header: "Issued Date", render: (item: InvoiceRow) => formatDate(item.issuedDate) },
    { key: "dueDate", header: "Due Date", render: (item: InvoiceRow) => formatDate(item.dueDate) },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (item: InvoiceRow) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (item: InvoiceRow) => {
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
  ], []);

  return (
    <DashboardLayout title="Invoices">
      <div className="max-w-[1400px] mx-auto space-y-[24px] relative z-10">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-accent-orange/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-60 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-text-primary">Create Invoice</h3>
          <p className="text-xs text-text-muted mt-0.5">Issue a new invoice and track it in collections.</p>

          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitInvoice}>
            <Input
              label="Client Name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              required
            />

            <Input
              label="Subtotal"
              type="number"
              min={0}
              step="0.01"
              value={subtotal}
              onChange={(event) => setSubtotal(event.target.value)}
              required
            />

            <Input
              label="Tax Rate (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
            />

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />

            <div className="md:col-span-2 flex items-center justify-between gap-3">
              {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : <span className="text-xs text-text-muted">Requires Admin or Accountant role.</span>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="text-base font-semibold text-text-primary">All Invoices</h3>
               <p className="text-xs text-text-muted mt-0.5">Manage billing and collections</p>
             </div>
           </div>
           
           <Table 
             data={rows} 
             columns={columns} 
             onRowClick={(item) => console.log("Clicked invoice", item.id)}
           />
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
