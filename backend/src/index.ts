import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { AccountType, DebitCredit, Role } from "@prisma/client";
import { z } from "zod";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { withTenantContext } from "./middleware/context.js";
import { requireRole } from "./middleware/rbac.js";
import { createAuditLog } from "./lib/audit.js";
import { getInsights } from "./services/analytics.js";
import { bootstrapTenant } from "./services/bootstrap.js";
import { createInvoice, listInvoices, recordInvoicePayment } from "./services/invoices.js";
import { createGoal, deleteGoal, listGoals, updateGoal } from "./services/goals.js";
import {
  createLedgerTransaction,
  getDashboardSummary,
  getExpenseBreakdown,
  getMonthlyRevenueExpense,
  listTransactions
} from "./services/ledger.js";
import { previewReconciliation } from "./services/reconciliation.js";
import {
  getBalanceSheetReport,
  getCashFlowReport,
  getProfitAndLossReport,
  getTrialBalanceReport
} from "./services/reports.js";
import {
  createWorkspaceForUser,
  inviteWorkspaceMember,
  listWorkspaceMembers,
  listWorkspacesForEmail
} from "./services/workspaces.js";

const app = express();

const transactionSchema = z.object({
  description: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1).optional(),
  date: z.string().datetime().optional(),
  reference: z.string().trim().min(1).optional()
});

const invoiceSchema = z.object({
  clientName: z.string().trim().min(2),
  subtotal: z.number().positive(),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime(),
  issuedDate: z.string().datetime().optional(),
  currency: z.string().trim().min(3).max(3).optional()
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().trim().min(2),
  reference: z.string().trim().min(1).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
});

const reconciliationSchema = z.object({
  csvContent: z.string().min(1)
});

const accountCreateSchema = z.object({
  code: z.string().trim().min(3).max(10),
  name: z.string().trim().min(2),
  type: z.nativeEnum(AccountType),
  normalSide: z.nativeEnum(DebitCredit).optional(),
  isActive: z.boolean().optional()
});

const goalCreateSchema = z.object({
  label: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional(),
  current: z.number().min(0).optional(),
  target: z.number().positive()
});

const goalUpdateSchema = z.object({
  label: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(200).optional(),
  current: z.number().min(0).optional(),
  target: z.number().positive().optional()
});

const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(48).optional(),
  baseCurrency: z.string().trim().length(3).optional()
});

const workspaceInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  role: z.enum(["admin", "accountant", "viewer"]),
  password: z.string().trim().min(3).max(72).optional()
});

function getDefaultNormalSide(type: AccountType): DebitCredit {
  switch (type) {
    case AccountType.ASSET:
    case AccountType.EXPENSE:
      return DebitCredit.DEBIT;
    case AccountType.LIABILITY:
    case AccountType.EQUITY:
    case AccountType.REVENUE:
      return DebitCredit.CREDIT;
    default:
      return DebitCredit.DEBIT;
  }
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    service: "ledgerflow-backend",
    status: "ok",
    message: "Backend is running. Use /health or /api/* endpoints.",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ledgerflow-backend", timestamp: new Date().toISOString() });
});

app.post("/api/auth/login", withTenantContext, async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const tenantId = req.ctx!.tenantId;

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: payload.email
        }
      }
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const ok = await bcrypt.compare(payload.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        tenantId,
        role: user.role,
        email: user.email
      },
      env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", withTenantContext);

app.get("/api/bootstrap", async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.ctx!.tenantId } });

    if (!tenant) {
      res.status(404).json({ message: "Tenant not found" });
      return;
    }

    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { role: "asc" }
    });

    res.json({
      tenant,
      users
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/workspaces", async (req, res, next) => {
  try {
    const userEmail = req.ctx?.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "User context missing. Sign in again to continue." });
      return;
    }

    const data = await listWorkspacesForEmail(userEmail);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/workspaces", async (req, res, next) => {
  try {
    const userEmail = req.ctx?.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "User context missing. Sign in again to continue." });
      return;
    }

    const payload = workspaceCreateSchema.parse(req.body);
    const created = await createWorkspaceForUser({
      creatorEmail: userEmail,
      currentTenantId: req.ctx!.tenantId,
      name: payload.name,
      slug: payload.slug,
      baseCurrency: payload.baseCurrency
    });

    await createAuditLog({
      tenantId: req.ctx!.tenantId,
      userId: req.ctx!.userId,
      action: "WORKSPACE_CREATED",
      entity: "tenant",
      entityId: created.tenantId,
      metadata: {
        name: created.name,
        slug: created.slug,
        baseCurrency: created.baseCurrency
      }
    });

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.get("/api/workspaces/members", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const data = await listWorkspaceMembers(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/workspaces/invite", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const payload = workspaceInviteSchema.parse(req.body);
    const invited = await inviteWorkspaceMember({
      tenantId: req.ctx!.tenantId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      password: payload.password
    });

    await createAuditLog({
      tenantId: req.ctx!.tenantId,
      userId: req.ctx!.userId,
      action: "WORKSPACE_MEMBER_INVITED",
      entity: "user",
      entityId: invited.id,
      metadata: {
        email: invited.email,
        role: invited.role
      }
    });

    res.status(201).json({ data: invited });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard", async (req, res, next) => {
  try {
    const tenantId = req.ctx!.tenantId;
    const [summary, monthly, expenseBreakdown, recentTransactions] = await Promise.all([
      getDashboardSummary(tenantId),
      getMonthlyRevenueExpense(tenantId),
      getExpenseBreakdown(tenantId),
      listTransactions(tenantId)
    ]);

    res.json({
      summary,
      monthly,
      expenseBreakdown,
      recentTransactions: recentTransactions.slice(0, 8)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/transactions", async (req, res, next) => {
  try {
    const data = await listTransactions(req.ctx!.tenantId);
    res.json({
      data,
      total: data.length,
      page: 1,
      limit: data.length || 10
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/transactions", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const payload = transactionSchema.parse(req.body);
    const result = await createLedgerTransaction(req.ctx!.tenantId, {
      ...payload,
      createdById: req.ctx!.userId
    });

    const latest = await listTransactions(req.ctx!.tenantId);
    const created = latest.find((tx) => tx.id === result.id);

    res.status(201).json({ data: created ?? null });
  } catch (error) {
    next(error);
  }
});

app.get("/api/invoices", async (req, res, next) => {
  try {
    const data = await listInvoices(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/invoices", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const payload = invoiceSchema.parse(req.body);
    const created = await createInvoice(req.ctx!.tenantId, {
      ...payload,
      createdById: req.ctx!.userId
    });

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.post("/api/invoices/:invoiceId/payments", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const invoiceId = String(req.params.invoiceId ?? "");
    const payload = paymentSchema.parse(req.body);
    const result = await recordInvoicePayment(req.ctx!.tenantId, invoiceId, {
      ...payload,
      createdById: req.ctx!.userId
    });

    await createLedgerTransaction(req.ctx!.tenantId, {
      description: `Invoice payment received (${result.invoiceId})`,
      amount: payload.amount,
      type: "income",
      category: "Invoice Payment",
      createdById: req.ctx!.userId
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

app.get("/api/goals", async (req, res, next) => {
  try {
    const data = await listGoals(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/goals", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const payload = goalCreateSchema.parse(req.body);
    const created = await createGoal(req.ctx!.tenantId, {
      ...payload,
      createdById: req.ctx!.userId
    });

    await createAuditLog({
      tenantId: req.ctx!.tenantId,
      userId: req.ctx!.userId,
      action: "GOAL_CREATED",
      entity: "goal",
      entityId: created.id,
      metadata: {
        label: created.label,
        target: created.target
      }
    });

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/goals/:goalId", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const goalId = String(req.params.goalId ?? "");
    const payload = goalUpdateSchema.parse(req.body);
    const updated = await updateGoal(req.ctx!.tenantId, goalId, payload);

    if (!updated) {
      res.status(404).json({ message: "Goal not found" });
      return;
    }

    await createAuditLog({
      tenantId: req.ctx!.tenantId,
      userId: req.ctx!.userId,
      action: "GOAL_UPDATED",
      entity: "goal",
      entityId: updated.id,
      metadata: {
        label: updated.label,
        target: updated.target,
        current: updated.current
      }
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/goals/:goalId", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const goalId = String(req.params.goalId ?? "");
    const removed = await deleteGoal(req.ctx!.tenantId, goalId);

    if (!removed) {
      res.status(404).json({ message: "Goal not found" });
      return;
    }

    await createAuditLog({
      tenantId: req.ctx!.tenantId,
      userId: req.ctx!.userId,
      action: "GOAL_DELETED",
      entity: "goal",
      entityId: goalId
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/profit-loss", async (req, res, next) => {
  try {
    const data = await getProfitAndLossReport(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/trial-balance", async (req, res, next) => {
  try {
    const data = await getTrialBalanceReport(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/balance-sheet", async (req, res, next) => {
  try {
    const data = await getBalanceSheetReport(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/cash-flow", async (req, res, next) => {
  try {
    const data = await getCashFlowReport(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics/insights", async (req, res, next) => {
  try {
    const data = await getInsights(req.ctx!.tenantId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reconciliation/preview", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const payload = reconciliationSchema.parse(req.body);
    const data = await previewReconciliation(req.ctx!.tenantId, payload.csvContent);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/accounts", async (req, res, next) => {
  try {
    const data = await prisma.account.findMany({
      where: { tenantId: req.ctx!.tenantId },
      orderBy: { code: "asc" }
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/accounts", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const payload = accountCreateSchema.parse(req.body);
    const tenantId = req.ctx!.tenantId;

    const existing = await prisma.account.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: payload.code
        }
      }
    });

    if (existing) {
      res.status(409).json({ message: "Account code already exists" });
      return;
    }

    const account = await prisma.account.create({
      data: {
        tenantId,
        code: payload.code,
        name: payload.name,
        type: payload.type,
        normalSide: payload.normalSide ?? getDefaultNormalSide(payload.type),
        isSystem: false,
        isActive: payload.isActive ?? true
      }
    });

    await createAuditLog({
      tenantId,
      userId: req.ctx!.userId,
      action: "ACCOUNT_CREATED",
      entity: "account",
      entityId: account.id,
      metadata: {
        code: account.code,
        name: account.name,
        type: account.type
      }
    });

    res.status(201).json({ data: account });
  } catch (error) {
    next(error);
  }
});

app.get("/api/audit-logs", requireRole(Role.ADMIN, Role.ACCOUNTANT), async (req, res, next) => {
  try {
    const data = await prisma.auditLog.findMany({
      where: { tenantId: req.ctx!.tenantId },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ message: "Validation failed", issues: error.issues });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Unknown server error" });
});

async function start(): Promise<void> {
  const seededTenant = await bootstrapTenant();

  app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
    console.log(`Default tenant slug: ${seededTenant.slug}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
