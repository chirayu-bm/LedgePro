import bcrypt from "bcryptjs";
import { AccountType, DebitCredit, Role } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../config.js";
import { createLedgerTransaction } from "./ledger.js";
import { createInvoice } from "./invoices.js";

const SYSTEM_ACCOUNTS = [
  { code: "1000", name: "Cash & Bank", type: AccountType.ASSET, normalSide: DebitCredit.DEBIT },
  { code: "1100", name: "Accounts Receivable", type: AccountType.ASSET, normalSide: DebitCredit.DEBIT },
  { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY, normalSide: DebitCredit.CREDIT },
  { code: "3000", name: "Owner Equity", type: AccountType.EQUITY, normalSide: DebitCredit.CREDIT },
  { code: "4000", name: "Sales Revenue", type: AccountType.REVENUE, normalSide: DebitCredit.CREDIT },
  { code: "5000", name: "Operating Expense", type: AccountType.EXPENSE, normalSide: DebitCredit.DEBIT }
];

async function ensureUsers(tenantId: string): Promise<void> {
  if (env.NODE_ENV === "production") {
    return;
  }

  const demoPassword = (env.DEMO_USER_PASSWORD ?? "").trim();
  if (!demoPassword) {
    console.warn("DEMO_USER_PASSWORD not set; skipping demo user seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const users = [
    { name: "Workspace Admin", email: "admin@ledgerflow.io", role: Role.ADMIN },
    { name: "Accountant", email: "accountant@ledgerflow.io", role: Role.ACCOUNTANT },
    { name: "Viewer", email: "viewer@ledgerflow.io", role: Role.VIEWER }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: user.email
        }
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash
      },
      create: {
        tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash
      }
    });
  }
}

export async function ensureSystemAccountsForTenant(tenantId: string): Promise<void> {
  for (const account of SYSTEM_ACCOUNTS) {
    await prisma.account.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: account.code
        }
      },
      update: {
        name: account.name,
        type: account.type,
        normalSide: account.normalSide,
        isSystem: true,
        isActive: true
      },
      create: {
        tenantId,
        code: account.code,
        name: account.name,
        type: account.type,
        normalSide: account.normalSide,
        isSystem: true,
        isActive: true
      }
    });
  }
}

async function seedDemoData(tenantId: string): Promise<void> {
  const entryCount = await prisma.journalEntry.count({ where: { tenantId } });

  if (entryCount > 0) return;

  const now = new Date();

  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 8);

    await createLedgerTransaction(tenantId, {
      description: `Client settlements - ${baseDate.toLocaleString("en-US", { month: "short" })}`,
      amount: 12000 + (5 - monthOffset) * 1800,
      type: "income",
      category: "Revenue",
      date: baseDate.toISOString()
    });

    await createLedgerTransaction(tenantId, {
      description: `Operating expenses - ${baseDate.toLocaleString("en-US", { month: "short" })}`,
      amount: 4200 + (5 - monthOffset) * 420,
      type: "expense",
      category: "Operations",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 14).toISOString()
    });

    await createLedgerTransaction(tenantId, {
      description: `Marketing spend - ${baseDate.toLocaleString("en-US", { month: "short" })}`,
      amount: 1800 + (5 - monthOffset) * 120,
      type: "expense",
      category: "Marketing",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 20).toISOString()
    });
  }

  const invoiceCount = await prisma.invoice.count({ where: { tenantId } });

  if (invoiceCount === 0) {
    await createInvoice(tenantId, {
      clientName: "Acme Corp",
      subtotal: 12500,
      taxRate: 18,
      issuedDate: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
    });

    await createInvoice(tenantId, {
      clientName: "Beta Inc",
      subtotal: 8600,
      taxRate: 18,
      issuedDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 20).toISOString()
    });

    await createInvoice(tenantId, {
      clientName: "Delta LLC",
      subtotal: 15100,
      taxRate: 18,
      issuedDate: new Date(now.getFullYear(), now.getMonth() - 2, 12).toISOString(),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 2).toISOString()
    });
  }
}

export async function ensureDefaultGoalsForTenant(tenantId: string): Promise<void> {
  const goalCount = await prisma.goal.count({ where: { tenantId } });
  if (goalCount > 0) return;

  await prisma.goal.createMany({
    data: [
      {
        tenantId,
        label: "Emergency Buffer",
        description: "2-month operating runway",
        current: 0,
        target: 15000
      },
      {
        tenantId,
        label: "Expansion Fund",
        description: "Quarter growth reserve",
        current: 0,
        target: 40000
      },
      {
        tenantId,
        label: "Team Offsite",
        description: "Culture and retention reserve",
        current: 0,
        target: 12000
      }
    ]
  });
}

export async function bootstrapTenant(): Promise<{ id: string; slug: string; name: string }> {
  const tenant = await prisma.tenant.upsert({
    where: {
      slug: env.DEFAULT_TENANT_SLUG
    },
    update: {
      name: "LedgerFlow Demo SME",
      baseCurrency: "USD"
    },
    create: {
      slug: env.DEFAULT_TENANT_SLUG,
      name: "LedgerFlow Demo SME",
      baseCurrency: "USD"
    }
  });

  await ensureUsers(tenant.id);
  await ensureSystemAccountsForTenant(tenant.id);
  await seedDemoData(tenant.id);
  await ensureDefaultGoalsForTenant(tenant.id);

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name
  };
}
