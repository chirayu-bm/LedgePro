"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  Send,
  Download,
  HandCoins,
  Gauge,
  Target,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Brush,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import {
  createGoal,
  fetchDashboard,
  fetchGoals,
  fetchTransactions,
  removeGoal,
  updateGoal,
  type DashboardSummaryResponse,
  type GoalItem,
  type LedgerTransaction
} from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

type ActivityWindow = "3m" | "6m" | "12m";
type ActivitySeries = "all" | "income" | "expense" | "net";

const windowConfig: Record<ActivityWindow, { label: string; points: number }> = {
  "3m": { label: "3M", points: 3 },
  "6m": { label: "6M", points: 6 },
  "12m": { label: "12M", points: 12 }
};

type GoalFormState = {
  label: string;
  description: string;
  current: string;
  target: string;
};

const statusTone: Record<string, string> = {
  completed: "text-accent-green",
  pending: "text-accent-orange",
  failed: "text-accent-red",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, transactions, setTransactions, setTransactionSearchQuery } = useAppStore();
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [allTransactions, setAllTransactions] = useState<LedgerTransaction[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activityWindow, setActivityWindow] = useState<ActivityWindow>("6m");
  const [activitySeries, setActivitySeries] = useState<ActivitySeries>("all");
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);
  const [isGoalSubmitting, setIsGoalSubmitting] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormState>({
    label: "",
    description: "",
    current: "0",
    target: ""
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [dashboardResult, transactionsResult, goalsResult] = await Promise.allSettled([
        fetchDashboard(user?.role),
        fetchTransactions(user?.role),
        fetchGoals(user?.role)
      ]);

      if (cancelled) return;

      const dashboardDataValue = dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
      const fullTransactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
      const goalRows = goalsResult.status === "fulfilled" ? goalsResult.value : [];

      setDashboardData(dashboardDataValue);
      setAllTransactions(fullTransactions);
      setGoals(goalRows);

      if (dashboardDataValue) {
        setTransactions(dashboardDataValue.recentTransactions);
      } else {
        setTransactions(fullTransactions.slice(0, 8));
      }

      if (dashboardResult.status === "rejected" && transactionsResult.status === "rejected") {
        setLoadError("Live data is unavailable right now. Make sure backend is running on localhost:4000.");
      } else {
        setLoadError(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [setTransactions, user?.role]);

  const withdrawalRows = transactions.length
    ? transactions.filter((tx) => tx.type === "debit").slice(0, 4)
    : [];

  const chartData = useMemo(() => {
    const monthly = dashboardData?.monthly ?? [];
    const points = windowConfig[activityWindow].points;

    return monthly.slice(-points).map((row) => ({
      month: row.month,
      income: row.revenue,
      expense: row.expenses,
      net: row.revenue - row.expenses
    }));
  }, [dashboardData, activityWindow]);

  const chartDomain = useMemo(() => {
    if (!chartData.length) {
      return { min: 0, max: 1000 };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const row of chartData) {
      min = Math.min(min, row.expense, row.income, row.net);
      max = Math.max(max, row.expense, row.income, row.net);
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 1000 };
    }

    const padding = Math.max(300, Math.round((max - min) * 0.16));
    return {
      min: Math.floor((min - padding) / 100) * 100,
      max: Math.ceil((max + padding) / 100) * 100
    };
  }, [chartData]);

  const selectedPoint = activePointIndex !== null ? chartData[activePointIndex] ?? null : chartData[chartData.length - 1] ?? null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonthKey = todayIso.slice(0, 7);
  const daysElapsed = Math.max(1, new Date().getDate());

  const monthDebitSpent = allTransactions
    .filter((tx) => tx.type === "debit" && tx.date.startsWith(currentMonthKey))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaySpent = allTransactions
    .filter((tx) => tx.type === "debit" && tx.date === todayIso)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const inferredDailyLimit = monthDebitSpent > 0
    ? Math.max(500, Math.round((monthDebitSpent / daysElapsed) * 1.15))
    : 2000;

  const effectiveTodaySpent = todaySpent > 0 ? todaySpent : monthDebitSpent / daysElapsed;
  const dailyUsagePercent = inferredDailyLimit > 0
    ? Math.min(100, Math.round((effectiveTodaySpent / inferredDailyLimit) * 100))
    : 0;

  const dailyUsageTone = "from-accent-green via-[#8bd45f] to-[#7ec7ff]";

  const goalProgressTone = dailyUsageTone;

  const canManageGoals = user?.role === "admin" || user?.role === "accountant";
  const displayUserName = user?.name?.trim() || "User";

  const openCreateGoalModal = () => {
    setEditingGoalId(null);
    setGoalFormError(null);
    setGoalForm({
      label: "",
      description: "",
      current: "0",
      target: ""
    });
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: GoalItem) => {
    setEditingGoalId(goal.id);
    setGoalFormError(null);
    setGoalForm({
      label: goal.label,
      description: goal.description ?? "",
      current: String(goal.current),
      target: String(goal.target)
    });
    setIsGoalModalOpen(true);
  };

  const submitGoalForm = async () => {
    const label = goalForm.label.trim();
    const description = goalForm.description.trim();
    const current = Number(goalForm.current);
    const target = Number(goalForm.target);

    if (label.length < 2) {
      setGoalFormError("Goal name should be at least 2 characters.");
      return;
    }

    if (!Number.isFinite(current) || current < 0) {
      setGoalFormError("Current value must be a non-negative number.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setGoalFormError("Target value must be greater than zero.");
      return;
    }

    setIsGoalSubmitting(true);
    setGoalFormError(null);

    try {
      if (editingGoalId) {
        const updated = await updateGoal(
          editingGoalId,
          {
            label,
            description: description || undefined,
            current,
            target
          },
          user?.role
        );

        setGoals((prev) => prev.map((goal) => (goal.id === updated.id ? updated : goal)));
      } else {
        const created = await createGoal(
          {
            label,
            description: description || undefined,
            current,
            target
          },
          user?.role
        );

        setGoals((prev) => [...prev, created]);
      }

      setIsGoalModalOpen(false);
    } catch (error) {
      setGoalFormError(error instanceof Error ? error.message : "Unable to save goal right now.");
    } finally {
      setIsGoalSubmitting(false);
    }
  };

  const deleteGoalById = async (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    const approved = window.confirm(`Delete goal \"${goal?.label ?? "this goal"}\"?`);
    if (!approved) return;

    try {
      await removeGoal(goalId, user?.role);
      setGoals((prev) => prev.filter((item) => item.id !== goalId));
    } catch {
      // Keep lightweight UI flow while still surfacing failure.
      window.alert("Could not delete goal. Please try again.");
    }
  };

  const quickActions = [
    {
      label: "Top Up",
      icon: Plus,
      href: "/transactions?action=topup&type=income&category=Top%20Up"
    },
    {
      label: "Transfer",
      icon: Send,
      href: "/transactions?action=transfer&type=expense&category=Transfer%20Out"
    },
    {
      label: "Withdraw",
      icon: Download,
      href: "/transactions?action=withdraw&type=expense&category=Withdrawal"
    },
    { label: "Request", icon: HandCoins, href: "/invoices?action=request" },
    { label: "Reports", icon: ArrowUpRight, href: "/reports" },
    { label: "Analytics", icon: CircleDollarSign, href: "/analytics" }
  ];

  const renderMonthTick = ({ x, y, payload, index }: { x?: number | string; y?: number | string; payload?: { value?: string }; index?: number }) => {
    const safeX = typeof x === "number" ? x : Number(x ?? 0);
    const safeY = typeof y === "number" ? y : Number(y ?? 0);
    const label = payload?.value ?? "";
    const isFirst = (index ?? 0) === 0;
    const isLast = (index ?? 0) === Math.max(0, chartData.length - 1);

    return (
      <text
        x={safeX + (isFirst ? 8 : isLast ? -8 : 0)}
        y={safeY + 20}
        fill="#fff"
        fontSize={12}
        fontWeight={600}
        textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
      >
        {label}
      </text>
    );
  };

  return (
    <DashboardLayout title="Overview">
      <div className="relative mx-auto max-w-[1480px] pb-8 pt-6">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />

        {loadError && (
          <div className="mb-4 rounded-2xl border border-accent-red/35 bg-accent-red/10 px-4 py-3 text-sm text-red-100">
            {loadError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="space-y-6">
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass-strong rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-glass-border/70 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
                  <p className="text-sm text-text-secondary">Good afternoon, team</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-white">Financial cockpit is stable</h2>
                  <p className="mt-3 text-sm text-text-muted">
                    11 invoices processed today and cashflow forecast updated 2 minutes ago.
                  </p>
                  <button
                    onClick={() => router.push("/settings")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                  >
                    Manage Workspace
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="rounded-2xl border border-glass-border/70 bg-gradient-to-br from-white/[0.07] to-white/[0.01] p-5 transition hover:from-white/[0.1]">
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Main wallet</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-green/10 px-2 py-1 text-xs text-accent-green">
                      <CircleDollarSign size={12} />
                      +15.2%
                    </span>
                  </div>
                  <p className={`mt-3 font-heading text-4xl font-semibold ${(dashboardData?.summary.netBalance ?? 0) >= 0 ? "text-white" : "text-accent-red"}`}>
                    {formatCurrency(dashboardData?.summary.netBalance ?? 0)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>Updated just now</span>
                    <span>USD</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Activity Summary</h3>
                  <p className="mt-0.5 text-xs text-text-muted">Live movement from posted entries</p>
                </div>
                <div className="inline-flex rounded-full border border-glass-border bg-white/[0.03] p-1 text-xs">
                  {(Object.keys(windowConfig) as ActivityWindow[]).map((windowKey) => (
                    <button
                      key={windowKey}
                      type="button"
                      onClick={() => setActivityWindow(windowKey)}
                      className={`rounded-full px-3 py-1 transition ${
                        activityWindow === windowKey ? "bg-white/[0.08] text-white" : "text-text-muted"
                      }`}
                    >
                      {windowConfig[windowKey].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {([
                  { key: "all", label: "All" },
                  { key: "income", label: "Income" },
                  { key: "expense", label: "Expense" },
                  { key: "net", label: "Net" }
                ] as Array<{ key: ActivitySeries; label: string }>).map((series) => (
                  <button
                    key={series.key}
                    type="button"
                    onClick={() => setActivitySeries(series.key)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      activitySeries === series.key
                        ? "border-accent-orange/50 bg-accent-orange/10 text-white"
                        : "border-glass-border bg-white/[0.02] text-text-secondary hover:text-white"
                    }`}
                  >
                    {series.label}
                  </button>
                ))}
              </div>

              {selectedPoint && (
                <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded-xl border border-glass-border bg-white/[0.02] px-3 py-2">
                    <p className="text-xs text-text-muted">Month</p>
                    <p className="text-sm font-semibold text-white">{selectedPoint.month}</p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/[0.02] px-3 py-2">
                    <p className="text-xs text-text-muted">Income vs Expense</p>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(selectedPoint.income)} / {formatCurrency(selectedPoint.expense)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-white/[0.02] px-3 py-2">
                    <p className="text-xs text-text-muted">Net Movement</p>
                    <p className={`text-sm font-semibold ${selectedPoint.net >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {selectedPoint.net >= 0 ? "+" : ""}
                      {formatCurrency(selectedPoint.net)}
                    </p>
                  </div>
                </div>
              )}

              <div className="h-[21rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    className="activity-summary-chart"
                    data={chartData}
                    margin={{ top: 20, right: 2, left: 20, bottom: 46 }}
                    onMouseMove={(state) => {
                      if (typeof state.activeTooltipIndex === "number") {
                        setActivePointIndex(state.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setActivePointIndex(null)}
                  >
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#78E36A" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#78E36A" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      height={40}
                      padding={{ left: 0, right: 0 }}
                      tick={renderMonthTick}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#fff", fontWeight: 600, fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(Number(value))}
                      domain={[chartDomain.min, chartDomain.max]}
                    />

                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="min-w-[180px] rounded-xl border border-white/10 bg-[#171A22]/95 p-3 text-xs shadow-2xl">
                            <div className="mb-2 text-[11px] font-semibold text-white/80">{label}</div>
                            {payload.map((entry) => (
                              <div key={String(entry.dataKey)} className="mb-1 flex items-center gap-2 text-white last:mb-0">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{
                                    background:
                                      entry.dataKey === "income"
                                        ? "#3B82F6"
                                        : entry.dataKey === "expense"
                                          ? "#78E36A"
                                          : "#FF7A00"
                                  }}
                                />
                                <span className="text-white/80">
                                  {entry.dataKey === "income" ? "Income" : entry.dataKey === "expense" ? "Expense" : "Net"}
                                </span>
                                <span className="ml-auto font-semibold text-white">{formatCurrency(Number(entry.value ?? 0))}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#3B82F6"
                      strokeWidth={2.3}
                      fill="url(#incomeGradient)"
                      dot={false}
                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#3B82F6" }}
                      hide={activitySeries !== "all" && activitySeries !== "income"}
                      isAnimationActive
                      animationDuration={650}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#78E36A"
                      strokeWidth={2.3}
                      fill="url(#expenseGradient)"
                      dot={false}
                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#78E36A" }}
                      hide={activitySeries !== "all" && activitySeries !== "expense"}
                      isAnimationActive
                      animationDuration={650}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#FF7A00"
                      strokeWidth={2.2}
                      fill="rgba(255,122,0,0.04)"
                      dot={false}
                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#FF7A00" }}
                      hide={activitySeries !== "all" && activitySeries !== "net"}
                      isAnimationActive
                      animationDuration={650}
                    />

                    {chartData.length > 4 && (
                      <Brush
                        dataKey="month"
                        height={4}
                        travellerWidth={3}
                        stroke="rgba(255,255,255,0.14)"
                        fill="rgba(255,255,255,0.03)"
                        tickFormatter={() => ""}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex flex-wrap gap-6 px-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#3B82F6" }} />
                  <span className="text-xs text-white font-medium">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#78E36A" }} />
                  <span className="text-xs text-white font-medium">Expense</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#FF7A00" }} />
                  <span className="text-xs text-white font-medium">Net</span>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold text-white">Recent Withdrawals</h3>
                <button
                  onClick={() => {
                    setTransactionSearchQuery("");
                    router.push("/transactions");
                  }}
                  className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {withdrawalRows.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-2xl border border-transparent bg-white/[0.02] px-3.5 py-3 transition hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-accent-red">-{formatCurrency(tx.amount)}</p>
                        <p className={`text-xs capitalize ${statusTone[tx.status] ?? "text-text-muted"}`}>{tx.status}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </section>

          <aside className="space-y-6">
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex rounded-full border border-glass-border bg-white/[0.03] p-1 text-xs">
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-white">Credit</span>
                  <span className="rounded-full px-3 py-1 text-text-muted">Debit</span>
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="inline-flex items-center gap-1 rounded-full border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={12} />
                  Add Card
                </button>
              </div>

              <div className="relative mx-auto min-h-[186px] w-full max-w-[338px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#2B2D31] via-[#3A3C41] to-[#4A4C52] px-4 pb-5 pt-3.5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.18),transparent_55%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_78%)]" />

                <div className="relative flex items-start justify-between">
                  <div className="pt-0.5 text-white/82">
                    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3.5 5.1C4.5 5.9 4.5 8.1 3.5 8.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 3.4C9 4.9 9 9.1 7 10.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.5 1.8C13.4 4 13.4 10 10.5 12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-right leading-none">
                    <p className="text-[15px] font-semibold tracking-[0.14em] text-white">**** **** 6541</p>
                    <p className="mt-1 text-[10px] text-white/72">12/26</p>
                  </div>
                </div>

                <div className="relative mt-8 flex items-end justify-between">
                  <div>
                    <svg width="44" height="30" viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect x="0.6" y="0.6" width="42.8" height="28.8" rx="5.8" fill="url(#chipBodyOrange)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

                      <path d="M3.8 9h36.4" stroke="#A86D28" strokeWidth="1" opacity="0.7" />
                      <path d="M3.8 15h36.4" stroke="#A86D28" strokeWidth="1" opacity="0.7" />
                      <path d="M3.8 21h36.4" stroke="#A86D28" strokeWidth="1" opacity="0.7" />

                      <rect x="14.3" y="8" width="15.4" height="14" rx="2.4" fill="#D18E3B" />
                      <path d="M22 8v14" stroke="#996426" strokeWidth="1" />
                      <path d="M14.3 15h15.4" stroke="#996426" strokeWidth="1" />

                      <defs>
                        <linearGradient id="chipBodyOrange" x1="2.5" y1="2" x2="41" y2="28" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#EFAE51" />
                          <stop offset="0.5" stopColor="#D7903F" />
                          <stop offset="1" stopColor="#B8772E" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <p className="mt-3 text-[10px] font-medium text-white/72">Card Holder Name</p>
                    <p className="mt-0.5 text-[22px] font-semibold leading-tight text-white">{displayUserName}</p>
                  </div>
                  <p className="text-[21px] font-black italic leading-none tracking-tight text-white/95">VISA</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-white">Quick Action</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setTransactionSearchQuery("");
                        router.push(item.href);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-white/[0.03] px-3 py-2 text-xs text-text-secondary transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
                    >
                      <item.icon size={13} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Gauge size={16} className="text-text-secondary" />
                <h3 className="font-heading text-lg font-semibold text-white">Daily Limit</h3>
              </div>
              <p className="text-sm text-text-secondary">{formatCurrency(effectiveTodaySpent)} used from {formatCurrency(inferredDailyLimit)}</p>
              <p className="mt-1 text-xs text-text-muted">Based on this month&apos;s real expense pace</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className={`h-full rounded-full bg-gradient-to-r ${dailyUsageTone}`} style={{ width: `${dailyUsagePercent}%` }} />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-text-secondary" />
                  <h3 className="font-heading text-lg font-semibold text-white">Goals</h3>
                </div>
                <button
                  type="button"
                  onClick={openCreateGoalModal}
                  disabled={!canManageGoals}
                  className="inline-flex items-center gap-1 rounded-full border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => {
                  const safeTarget = Math.max(goal.target, 0.01);
                  const percent = Math.max(0, Math.min(100, Math.round((goal.current / safeTarget) * 100)));
                  const achieved = goal.current >= safeTarget;
                  return (
                    <div
                      key={goal.id}
                      className={`rounded-2xl border p-3 transition hover:bg-white/[0.04] ${
                        achieved
                          ? "border-[#e9c46a]/45 bg-[linear-gradient(130deg,rgba(233,196,106,0.16),rgba(255,255,255,0.03)_35%,rgba(233,196,106,0.10))] shadow-[0_10px_28px_rgba(233,196,106,0.10)]"
                          : "border-glass-border/70 bg-white/[0.02]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <p className="text-white">{goal.label}</p>
                        <div className="flex items-center gap-2">
                          {achieved ? (
                            <motion.div
                              initial={{ opacity: 0.85, scale: 0.98 }}
                              animate={{ opacity: [0.92, 1, 0.92], scale: [0.99, 1.01, 0.99] }}
                              transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                              className="inline-flex items-center gap-1 rounded-full border border-[#e9c46a]/50 bg-gradient-to-r from-[#584515]/80 via-[#b7923f]/30 to-[#584515]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f6dd93] shadow-[0_0_12px_rgba(233,196,106,0.32)]"
                            >
                              <Sparkles size={11} className="text-[#f6dd93]" />
                              Achieved
                            </motion.div>
                          ) : (
                            <p className="text-text-secondary">{percent}%</p>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditGoalModal(goal)}
                            disabled={!canManageGoals}
                            className="rounded-md p-1 text-text-muted transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Edit ${goal.label}`}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGoalById(goal.id)}
                            disabled={!canManageGoals}
                            className="rounded-md p-1 text-text-muted transition hover:bg-accent-red/20 hover:text-accent-red disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Delete ${goal.label}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="mb-1 text-[11px] text-text-muted">{goal.description ?? "No description"}</p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </p>
                      {achieved && <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#f6dd93]">Goal completed</p>}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.08]">
                        <div
                          className={`h-full rounded-full ${
                            achieved
                              ? "bg-gradient-to-r from-[#d8ad4a] via-[#f6dd93] to-[#d8ad4a] shadow-[0_0_14px_rgba(233,196,106,0.42)]"
                              : `bg-gradient-to-r ${goalProgressTone}`
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {!goals.length && (
                  <div className="rounded-2xl border border-dashed border-glass-border/70 bg-white/[0.02] p-4 text-center">
                    <p className="text-sm text-text-secondary">No goals yet.</p>
                    <button
                      type="button"
                      onClick={openCreateGoalModal}
                      disabled={!canManageGoals}
                      className="mt-2 text-xs text-accent-orange transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Create your first goal
                    </button>
                  </div>
                )}
              </div>
              {!canManageGoals && (
                <p className="mt-3 text-[11px] text-text-muted">Viewer mode: only admins and accountants can modify goals.</p>
              )}
            </motion.div>
          </aside>
        </div>

        <Modal
          isOpen={isGoalModalOpen}
          onClose={() => {
            if (!isGoalSubmitting) {
              setIsGoalModalOpen(false);
            }
          }}
          title={editingGoalId ? "Edit Goal" : "Add Goal"}
        >
          <div className="space-y-3">
            <Input
              label="Goal Name"
              placeholder="Emergency Buffer"
              value={goalForm.label}
              onChange={(event) => setGoalForm((prev) => ({ ...prev, label: event.target.value }))}
              maxLength={80}
            />
            <Input
              label="Description"
              placeholder="Optional"
              value={goalForm.description}
              onChange={(event) => setGoalForm((prev) => ({ ...prev, description: event.target.value }))}
              maxLength={200}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Current Value (USD)"
                type="number"
                min={0}
                step="0.01"
                value={goalForm.current}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, current: event.target.value }))}
              />
              <Input
                label="Target Value (USD)"
                type="number"
                min={0.01}
                step="0.01"
                value={goalForm.target}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, target: event.target.value }))}
              />
            </div>
            {goalFormError && <p className="text-xs text-accent-red">{goalFormError}</p>}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                disabled={isGoalSubmitting}
                className="rounded-xl border border-glass-border px-4 py-2 text-sm text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitGoalForm()}
                disabled={isGoalSubmitting}
                className="rounded-xl bg-accent-orange px-4 py-2 text-sm font-medium text-white transition hover:bg-[#FF9A40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGoalSubmitting ? "Saving..." : editingGoalId ? "Update Goal" : "Create Goal"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
