"use client";

import {
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  Send,
  Download,
  HandCoins,
  Gauge,
  Target,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockTransactions, revenueData } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const activityData = revenueData.slice(-8).map((row) => ({
  month: row.month,
  income: Math.round(row.revenue / 100),
  expense: Math.round(row.expenses / 100),
}));

const interpolationSteps = 14;

const shapedActivityData = activityData.flatMap((point, index, arr) => {
  if (index === arr.length - 1) {
    const finalIndex = index * interpolationSteps;
    const progress = 1;
    const waveSeed = finalIndex;

    const macroIncome = 760 - ((progress - 0.62) / 0.38) * 270;
    const clusterDrop =
      -Math.abs(Math.sin((progress - 0.62) * 28)) * 24 -
      Math.abs(Math.sin((progress - 0.62) * 11)) * 13;
    const microWave =
      Math.sin(waveSeed * 1.9) * 14 +
      Math.sin(waveSeed * 3.35) * 7 +
      Math.sin(waveSeed * 0.55) * 4;

    const income = Math.round(macroIncome + clusterDrop + microWave);
    const gap = 242 + Math.sin(waveSeed * 1.25 + 0.8) * 10 + (progress - 0.5) * 26;
    const expense = Math.round(income - gap);

    return [{
      ...point,
      xLabel: point.month,
      pointIndex: finalIndex,
      anchorIndex: finalIndex,
      income: Math.max(420, income),
      expense: Math.max(120, Math.min(expense, income - 130)),
    }];
  }

  const points = Array.from({ length: interpolationSteps }, (_, step) => {
    const pointIndex = index * interpolationSteps + step;
    const progress = pointIndex / Math.max(1, (arr.length - 1) * interpolationSteps);
    const waveSeed = pointIndex;

    let macroIncome = 500;
    if (progress < 0.18) {
      macroIncome = 500 + (progress / 0.18) * 42;
    } else if (progress < 0.48) {
      macroIncome = 542 + ((progress - 0.18) / 0.3) * 252;
    } else if (progress < 0.62) {
      macroIncome = 794 - ((progress - 0.48) / 0.14) * 34;
    } else {
      macroIncome = 760 - ((progress - 0.62) / 0.38) * 270;
    }

    const clusterDrop =
      progress > 0.62
        ? -Math.abs(Math.sin((progress - 0.62) * 28)) * 24 - Math.abs(Math.sin((progress - 0.62) * 11)) * 13
        : 0;

    const microWave =
      Math.sin(waveSeed * 1.9) * 14 +
      Math.sin(waveSeed * 3.35) * 7 +
      Math.sin(waveSeed * 0.55) * 4;

    const income = macroIncome + clusterDrop + microWave;

    const gap =
      224 +
      Math.sin(waveSeed * 1.25 + 0.8) * 10 +
      Math.sin(waveSeed * 0.37) * 5 +
      progress * 20;

    const expenseLift = progress < 0.58 ? progress * 16 : -(progress - 0.58) * 18;
    const expense = income - gap + expenseLift;

    return {
      month: point.month,
      xLabel: step === 0 ? point.month : "",
      pointIndex,
      anchorIndex: step === 0 ? pointIndex : null,
      income: Math.max(420, Math.round(income)),
      expense: Math.max(120, Math.min(Math.round(expense), Math.round(income - 130))),
    };
  });

  return points;
});

const xAxisTicks = shapedActivityData
  .filter((point) => point.anchorIndex !== null)
  .map((point) => point.pointIndex);

const xAxisTickMap = new Map(
  shapedActivityData
    .filter((point) => point.anchorIndex !== null)
    .map((point) => [point.pointIndex, point.month]),
);

const goals = [
  { label: "Emergency Buffer", current: 24300, target: 30000 },
  { label: "Expansion Fund", current: 61700, target: 90000 },
  { label: "Team Offsite", current: 8300, target: 12000 },
];

const statusTone: Record<string, string> = {
  completed: "text-accent-green",
  pending: "text-accent-orange",
  failed: "text-accent-red",
};

export default function DashboardPage() {
  const quickActions = [
    { label: "Top Up", icon: Plus },
    { label: "Transfer", icon: Send },
    { label: "Withdraw", icon: Download },
    { label: "Request", icon: HandCoins },
  ];

  return (
    <DashboardLayout title="Overview">
      <div className="relative mx-auto max-w-[1480px] pb-8 pt-6">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-accent-orange/10 blur-3xl" />

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
                  <button className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white transition hover:bg-white/[0.08]">
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
                  <p className="mt-3 font-heading text-4xl font-semibold text-white">{formatCurrency(32126)}</p>
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
                  <h3 className="font-heading text-xl font-semibold text-white">Activity Summary</h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Weekly trend</p>
                </div>
                <div className="inline-flex rounded-full border border-glass-border bg-white/[0.03] p-1 text-xs">
                  <span className="rounded-full px-3 py-1 text-text-muted">Monthly</span>
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-white">Weekly</span>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={shapedActivityData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
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
                      type="number"
                      dataKey="pointIndex"
                      ticks={xAxisTicks}
                      tickFormatter={(value) => xAxisTickMap.get(Number(value)) ?? ""}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fill: "#fff", fontWeight: 600, fontSize: 13 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#fff", fontWeight: 600, fontSize: 13 }}
                      tickFormatter={(value) => `$${value}`}
                      domain={[0, 800]}
                    />

                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="min-w-[150px] rounded-xl border border-white/10 bg-[#171A22]/95 p-3 text-xs shadow-2xl">
                            <div className="mb-2 text-[11px] font-semibold text-white/80">{label}</div>
                            {payload.map((entry) => (
                              <div key={String(entry.dataKey)} className="mb-1 flex items-center gap-2 text-white last:mb-0">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ background: entry.dataKey === "income" ? "#3B82F6" : "#78E36A" }}
                                />
                                <span className="text-white/80">{entry.dataKey === "income" ? "Income" : "Expense"}</span>
                                <span className="ml-auto font-semibold text-white">${entry.value}</span>
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
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#78E36A"
                      strokeWidth={2.3}
                      fill="url(#expenseGradient)"
                      dot={false}
                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#78E36A" }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Legend below chart */}
                <div className="mt-2 flex gap-6 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#3B82F6' }} />
                    <span className="text-xs text-white font-medium">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#78E36A' }} />
                    <span className="text-xs text-white font-medium">Expense</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold text-white">Recent Withdrawals</h3>
                <button className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white">
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {mockTransactions
                  .filter((tx) => tx.type === "debit")
                  .slice(0, 4)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-2xl border border-transparent bg-white/[0.02] px-3.5 py-3 transition hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">-{formatCurrency(tx.amount)}</p>
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
                <button className="inline-flex items-center gap-1 rounded-full border border-glass-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-white">
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
                    <p className="mt-0.5 text-[22px] font-semibold leading-tight text-white">Aldeen Nasrun M</p>
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
              <p className="text-sm text-text-secondary">{formatCurrency(1200)} used from {formatCurrency(2000)}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-accent-green via-[#8bd45f] to-[#7ec7ff]" />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="glass rounded-3xl border border-glass-border/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Target size={16} className="text-text-secondary" />
                <h3 className="font-heading text-lg font-semibold text-white">Goals</h3>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.label} className="rounded-2xl border border-glass-border/70 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <p className="text-white">{goal.label}</p>
                        <p className="text-text-secondary">{percent}%</p>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-accent-green" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
