"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createAccount,
  createWorkspace,
  fetchAccounts,
  fetchAuditLogs,
  fetchWorkspaceMembers,
  fetchWorkspaces,
  getActiveTenantSlug,
  inviteWorkspaceMember,
  previewBankReconciliation,
  setActiveTenantSlug,
  type AppRole,
  type LedgerAccount,
  type WorkspaceMember,
  type WorkspaceSummary
} from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

const SAMPLE_CSV = `date,description,amount
2026-04-01,Client payout,12200
2026-04-02,Cloud vendor payment,1800`;

export default function SettingsPage() {
  const { user, setUserRole } = useAppStore();
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceSlug, setActiveWorkspaceSlugState] = useState(() => getActiveTenantSlug());
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlugInput, setWorkspaceSlugInput] = useState("");
  const [workspaceCurrency, setWorkspaceCurrency] = useState("USD");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceSubmitting, setWorkspaceSubmitting] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    matched: Array<{ bankDescription: string; amount: number; date: string; transactionId: string }>;
    unmatchedBankRows: Array<{ bankDescription: string; amount: number; date: string }>;
    unmatchedSystemTransactions: Array<{ id: string; description: string; amount: number; date: string }>;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; entity: string; entityId: string; createdAt: string }>>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<LedgerAccount["type"]>("ASSET");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const canInviteMembers = user?.role === "admin";
  const canViewMembers = user?.role === "admin" || user?.role === "accountant";
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.slug === activeWorkspaceSlug) ?? null,
    [activeWorkspaceSlug, workspaces]
  );

  useEffect(() => {
    if (!user?.email) {
      setWorkspaces([]);
      return;
    }

    let cancelled = false;

    const loadWorkspaces = async () => {
      try {
        const available = await fetchWorkspaces(user.role);
        if (cancelled) return;

        const storedSlug = getActiveTenantSlug();
        const resolvedSlug = available.some((workspace) => workspace.slug === storedSlug)
          ? storedSlug
          : available[0]?.slug ?? storedSlug;

        setWorkspaces(available);
        setActiveWorkspaceSlugState(resolvedSlug);
        setActiveTenantSlug(resolvedSlug);

        const activeMembership = available.find((workspace) => workspace.slug === resolvedSlug);
        if (activeMembership && activeMembership.role !== user.role) {
          setUserRole(activeMembership.role);
        }
      } catch {
        if (!cancelled) {
          setWorkspaces([]);
        }
      }
    };

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [setUserRole, user?.email, user?.role]);

  useEffect(() => {
    let cancelled = false;

    const loadAccounts = async () => {
      try {
        const data = await fetchAccounts(user?.role);
        if (!cancelled) {
          setAccounts(data);
        }
      } catch {
        if (!cancelled) {
          setAccounts([]);
        }
      }
    };

    void loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceSlug, user?.role]);

  useEffect(() => {
    if (!canViewMembers) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    const loadMembers = async () => {
      try {
        const rows = await fetchWorkspaceMembers(user?.role);
        if (!cancelled) {
          setMembers(rows);
        }
      } catch {
        if (!cancelled) {
          setMembers([]);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceSlug, canViewMembers, user?.role]);

  const summary = useMemo(() => {
    if (!result) {
      return { matched: 0, pending: 0 };
    }

    return {
      matched: result.matched.length,
      pending: result.unmatchedBankRows.length + result.unmatchedSystemTransactions.length
    };
  }, [result]);

  const runReconciliation = async () => {
    setLoading(true);
    try {
      const [preview, logs] = await Promise.all([
        previewBankReconciliation(csvContent, user?.role),
        fetchAuditLogs(user?.role)
      ]);

      setResult(preview);
      setAuditLogs(logs.slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const submitAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountError(null);
    setAccountSubmitting(true);

    try {
      if (!accountCode.trim() || !accountName.trim()) {
        throw new Error("Code and name are required.");
      }

      const created = await createAccount(
        {
          code: accountCode.trim(),
          name: accountName.trim(),
          type: accountType,
        },
        user?.role
      );

      setAccounts((previous) => [...previous.filter((item) => item.id !== created.id), created].sort((a, b) => a.code.localeCompare(b.code)));
      setAccountCode("");
      setAccountName("");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setAccountSubmitting(false);
    }
  };

  const switchWorkspace = (slug: string) => {
    setActiveTenantSlug(slug);
    setActiveWorkspaceSlugState(slug);

    const membership = workspaces.find((workspace) => workspace.slug === slug);
    if (membership) {
      setUserRole(membership.role);
    }
  };

  const submitWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorkspaceError(null);
    setWorkspaceSubmitting(true);

    try {
      if (!workspaceName.trim()) {
        throw new Error("Workspace name is required.");
      }

      const created = await createWorkspace(
        {
          name: workspaceName.trim(),
          slug: workspaceSlugInput.trim() || undefined,
          baseCurrency: workspaceCurrency.trim() || undefined
        },
        user?.role
      );

      setWorkspaces((previous) => {
        const merged = [...previous.filter((workspace) => workspace.tenantId !== created.tenantId), created];
        return merged.sort((left, right) => left.name.localeCompare(right.name));
      });

      switchWorkspace(created.slug);
      setWorkspaceName("");
      setWorkspaceSlugInput("");
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Failed to create workspace");
    } finally {
      setWorkspaceSubmitting(false);
    }
  };

  const submitInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteError(null);
    setInviteSubmitting(true);

    try {
      if (!inviteEmail.trim() || !inviteName.trim()) {
        throw new Error("Invite name and email are required.");
      }

      const invited = await inviteWorkspaceMember(
        {
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
          password: invitePassword.trim() || undefined
        },
        user?.role
      );

      setMembers((previous) => {
        const merged = [...previous.filter((member) => member.id !== invited.id), invited];
        return merged.sort((left, right) => left.name.localeCompare(right.name));
      });

      setInviteEmail("");
      setInviteName("");
      setInviteRole("viewer");
      setInvitePassword("");
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to invite team member");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Settings & Controls">
      <div className="mx-auto max-w-[1400px] space-y-6 relative z-10">
        <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-72 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Reconciliation Matches</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.matched}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending Review</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.pending}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Current Role</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-white">{user?.role ?? "viewer"}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Audit Events Loaded</p>
            <p className="mt-2 text-2xl font-semibold text-white">{auditLogs.length}</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-text-primary">Workspace Management</h3>
          <p className="mt-1 text-sm text-text-secondary">Create workspaces, switch context, and keep each client isolated.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Active Workspace</label>
              <select
                value={activeWorkspaceSlug}
                onChange={(event) => switchWorkspace(event.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50"
              >
                {!workspaces.length && <option value={activeWorkspaceSlug}>{activeWorkspaceSlug || "demo-sme"}</option>}
                {workspaces.map((workspace) => (
                  <option key={workspace.tenantId} value={workspace.slug}>
                    {workspace.name} ({workspace.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-glass-border/70 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Current Workspace</p>
              <p className="mt-2 text-sm text-white">{activeWorkspace?.name ?? "Demo Workspace"}</p>
              <p className="mt-1 text-xs text-text-secondary">Slug: {activeWorkspace?.slug ?? (activeWorkspaceSlug || "demo-sme")}</p>
              <p className="mt-1 text-xs text-text-secondary">Currency: {activeWorkspace?.baseCurrency ?? "USD"}</p>
            </div>
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-4" onSubmit={submitWorkspace}>
            <Input
              label="Workspace Name"
              placeholder="Acme Finance"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              required
            />

            <Input
              label="Slug (optional)"
              placeholder="acme-finance"
              value={workspaceSlugInput}
              onChange={(event) => setWorkspaceSlugInput(event.target.value)}
            />

            <Input
              label="Base Currency"
              placeholder="USD"
              value={workspaceCurrency}
              onChange={(event) => setWorkspaceCurrency(event.target.value.toUpperCase())}
              maxLength={3}
              required
            />

            <div className="flex items-end justify-end">
              <Button type="submit" disabled={workspaceSubmitting} className="w-full md:w-auto">
                {workspaceSubmitting ? "Creating..." : "Create Workspace"}
              </Button>
            </div>
          </form>

          {workspaceError && <p className="mt-3 text-sm text-accent-red">{workspaceError}</p>}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-text-primary">Team Access</h3>
          <p className="mt-1 text-sm text-text-secondary">Invite teammates by email and assign workspace roles.</p>

          <form className="mt-4 grid gap-4 md:grid-cols-5" onSubmit={submitInvite}>
            <Input
              label="Member Name"
              placeholder="Jane Doe"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              required
              disabled={!canInviteMembers}
            />

            <Input
              label="Email"
              placeholder="jane@acme.com"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              required
              disabled={!canInviteMembers}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as AppRole)}
                disabled={!canInviteMembers}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50"
              >
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <Input
              label="Temporary Password (optional)"
              placeholder="welcome123"
              value={invitePassword}
              onChange={(event) => setInvitePassword(event.target.value)}
              disabled={!canInviteMembers}
            />

            <div className="flex items-end justify-end">
              <Button type="submit" disabled={!canInviteMembers || inviteSubmitting} className="w-full md:w-auto">
                {inviteSubmitting ? "Inviting..." : "Invite Member"}
              </Button>
            </div>
          </form>

          {!canInviteMembers && (
            <p className="mt-3 text-xs text-text-muted">Only workspace admins can invite new members.</p>
          )}

          {inviteError && <p className="mt-3 text-sm text-accent-red">{inviteError}</p>}

          {canViewMembers && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Name</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Email</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Role</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-glass-border/50">
                      <td className="px-3 py-2 text-sm text-white">{member.name}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{member.email}</td>
                      <td className="px-3 py-2 text-sm capitalize text-text-secondary">{member.role}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatDate(member.createdAt)}</td>
                    </tr>
                  ))}
                  {!members.length && (
                    <tr>
                      <td className="px-3 py-3 text-sm text-text-muted" colSpan={4}>No members found in this workspace.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-text-primary">Chart of Accounts</h3>
          <p className="mt-1 text-sm text-text-secondary">Create and maintain company accounts used by your ledger postings.</p>

          <form className="mt-4 grid gap-4 md:grid-cols-4" onSubmit={submitAccount}>
            <Input
              label="Code"
              placeholder="6100"
              value={accountCode}
              onChange={(event) => setAccountCode(event.target.value)}
              required
            />

            <Input
              label="Name"
              placeholder="Office Supplies"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary font-medium">Type</label>
              <select
                value={accountType}
                onChange={(event) => setAccountType(event.target.value as LedgerAccount["type"])}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50"
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div className="flex items-end justify-end">
              <Button type="submit" disabled={accountSubmitting} className="w-full md:w-auto">
                {accountSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>

          {accountError && <p className="mt-3 text-sm text-accent-red">{accountError}</p>}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Code</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Name</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Type</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Normal Side</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-glass-border/50">
                    <td className="px-3 py-2 text-sm text-white">{account.code}</td>
                    <td className="px-3 py-2 text-sm text-white">{account.name}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{account.type}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{account.normalSide}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{account.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
                {!accounts.length && (
                  <tr>
                    <td className="px-3 py-3 text-sm text-text-muted" colSpan={5}>No accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-text-primary">Bank Reconciliation</h3>
          <p className="mt-1 text-sm text-text-secondary">Upload or paste bank CSV rows and run auto-match against ledger transactions.</p>

          <textarea
            value={csvContent}
            onChange={(event) => setCsvContent(event.target.value)}
            rows={8}
            className="mt-4 w-full rounded-xl border border-glass-border bg-white/[0.02] p-3 text-sm text-white outline-none focus:border-accent-orange/70"
          />

          <div className="mt-4 flex justify-end">
            <Button onClick={runReconciliation} disabled={loading}>
              {loading ? "Running..." : "Run Reconciliation"}
            </Button>
          </div>
        </GlassCard>

        {result && (
          <div className="grid gap-6 xl:grid-cols-3">
            <GlassCard className="p-5">
              <h4 className="text-sm font-semibold text-white">Matched Records</h4>
              <div className="mt-3 space-y-2">
                {result.matched.slice(0, 6).map((row) => (
                  <div key={`${row.transactionId}-${row.date}`} className="rounded-lg border border-glass-border/60 bg-white/[0.02] p-3">
                    <p className="text-sm text-white">{row.bankDescription}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(row.date)} · {formatCurrency(row.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h4 className="text-sm font-semibold text-white">Unmatched Bank Rows</h4>
              <div className="mt-3 space-y-2">
                {result.unmatchedBankRows.slice(0, 6).map((row) => (
                  <div key={`${row.bankDescription}-${row.date}`} className="rounded-lg border border-glass-border/60 bg-white/[0.02] p-3">
                    <p className="text-sm text-white">{row.bankDescription}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(row.date)} · {formatCurrency(row.amount)}
                    </p>
                  </div>
                ))}
                {!result.unmatchedBankRows.length && <p className="text-sm text-text-muted">No unmatched bank rows.</p>}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h4 className="text-sm font-semibold text-white">Recent Audit Logs</h4>
              <div className="mt-3 space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-glass-border/60 bg-white/[0.02] p-3">
                    <p className="text-sm text-white">{log.action.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {log.entity} · {formatDate(log.createdAt)}
                    </p>
                  </div>
                ))}
                {!auditLogs.length && <p className="text-sm text-text-muted">Run reconciliation to load audit events.</p>}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
