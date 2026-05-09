"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { expenseCategories } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface ExpenseChartProps {
  data?: Array<{ category: string; amount: number; fill: string }>;
}

type ExpenseSort = "highest" | "alphabetical";

const CustomTooltip = ({ active, payload }: {active?: boolean; payload?: Array<{value: number; payload: {category: string}}>}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong p-3 rounded-xl shadow-soft">
        <p className="text-xs text-text-muted mb-1">
          {payload[0].payload.category}
        </p>
        <p className="text-sm font-medium text-text-primary">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = data && data.length ? data : expenseCategories;
  const [sortMode, setSortMode] = useState<ExpenseSort>("highest");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    const rows = [...chartData];
    if (sortMode === "alphabetical") {
      rows.sort((a, b) => a.category.localeCompare(b.category));
      return rows;
    }

    rows.sort((a, b) => b.amount - a.amount);
    return rows;
  }, [chartData, sortMode]);

  return (
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="p-6 lg:p-8"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Expense Breakdown
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              By category this month
            </p>
          </div>
          <div className="inline-flex rounded-full border border-glass-border bg-white/[0.03] p-1 text-xs">
            <button
              type="button"
              onClick={() => setSortMode("highest")}
              className={`rounded-full px-3 py-1 transition ${
                sortMode === "highest" ? "bg-white/[0.08] text-white" : "text-text-muted"
              }`}
            >
              Highest
            </button>
            <button
              type="button"
              onClick={() => setSortMode("alphabetical")}
              className={`rounded-full px-3 py-1 transition ${
                sortMode === "alphabetical" ? "bg-white/[0.08] text-white" : "text-text-muted"
              }`}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: "rgba(251, 146, 60, 0.14)",
                stroke: "rgba(34, 211, 238, 0.45)",
                strokeWidth: 1,
              }}
            />
            <Bar
              dataKey="amount"
              radius={[8, 8, 0, 0]}
              isAnimationActive
              animationDuration={600}
              onMouseEnter={(_, index) => {
                setActiveCategory(sortedData[index]?.category ?? null);
              }}
              onMouseLeave={() => setActiveCategory(null)}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.fill}
                  fillOpacity={activeCategory && activeCategory !== entry.category ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {activeCategory && (
        <p className="mt-3 text-xs text-text-secondary">
          Focused category: <span className="font-semibold text-white">{activeCategory}</span>
        </p>
      )}
    </GlassCard>
  );
}
