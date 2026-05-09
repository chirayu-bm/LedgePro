import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { createAuditLog } from "../lib/audit.js";

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function computeInvoiceStatus(total: number, paid: number, dueDate: Date): InvoiceStatus {
  if (paid >= total) return InvoiceStatus.PAID;
  if (paid > 0) return InvoiceStatus.PARTIAL;
  if (dueDate.getTime() < Date.now()) return InvoiceStatus.OVERDUE;
  return InvoiceStatus.PENDING;
}

async function nextInvoiceNumber(tenantId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { tenantId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function listInvoices(tenantId: string): Promise<Array<{
  id: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
}>> {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { issuedDate: "desc" }
  });

  return invoices.map((invoice) => {
    const total = toNumber(invoice.totalAmount);
    const paid = toNumber(invoice.paidAmount);
    const status = computeInvoiceStatus(total, paid, invoice.dueDate);

    return {
      id: invoice.invoiceNumber,
      client: invoice.clientName,
      amount: total,
      status: status === InvoiceStatus.PAID ? "paid" : status === InvoiceStatus.OVERDUE ? "overdue" : "pending",
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      issuedDate: invoice.issuedDate.toISOString().slice(0, 10)
    };
  });
}

export async function createInvoice(tenantId: string, input: {
  clientName: string;
  subtotal: number;
  taxRate?: number;
  dueDate: string;
  issuedDate?: string;
  currency?: string;
  createdById?: string;
}): Promise<{ id: string; invoiceNumber: string }> {
  const subtotal = new Prisma.Decimal(input.subtotal);
  const taxRate = new Prisma.Decimal(input.taxRate ?? 0);
  const taxAmount = subtotal.mul(taxRate).div(100);
  const totalAmount = subtotal.add(taxAmount);

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber: await nextInvoiceNumber(tenantId),
      clientName: input.clientName,
      subtotal,
      taxAmount,
      totalAmount,
      currency: input.currency ?? "USD",
      status: InvoiceStatus.PENDING,
      issuedDate: input.issuedDate ? new Date(input.issuedDate) : new Date(),
      dueDate: new Date(input.dueDate)
    }
  });

  await createAuditLog({
    tenantId,
    userId: input.createdById,
    action: "INVOICE_CREATED",
    entity: "invoice",
    entityId: invoice.id,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(totalAmount)
    }
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber
  };
}

export async function recordInvoicePayment(tenantId: string, invoiceId: string, input: {
  amount: number;
  method: string;
  reference?: string;
  createdById?: string;
}): Promise<{ invoiceId: string; paidAmount: number; status: string }> {
  const amount = new Prisma.Decimal(input.amount);

  if (amount.lte(0)) {
    throw new Error("Payment amount must be greater than zero");
  }

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, tenantId }
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await tx.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        amount,
        method: input.method,
        reference: input.reference
      }
    });

    const nextPaidAmount = invoice.paidAmount.add(amount);
    const nextStatus = computeInvoiceStatus(Number(invoice.totalAmount), Number(nextPaidAmount), invoice.dueDate);

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: nextPaidAmount,
        status: nextStatus,
        paidAt: nextStatus === InvoiceStatus.PAID ? new Date() : null
      }
    });

    return {
      invoiceId: updatedInvoice.id,
      paidAmount: Number(updatedInvoice.paidAmount),
      status: updatedInvoice.status
    };
  });

  await createAuditLog({
    tenantId,
    userId: input.createdById,
    action: "INVOICE_PAYMENT_RECORDED",
    entity: "invoice",
    entityId: result.invoiceId,
    metadata: {
      amount: input.amount,
      method: input.method,
      reference: input.reference
    }
  });

  return result;
}
