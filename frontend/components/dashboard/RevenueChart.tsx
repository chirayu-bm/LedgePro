"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  Brush,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { revenueData } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number; expenses: number }>;
}

type RevenueRange = "6m" | "12m";

const rangeConfig: Record<RevenueRange, number> = {
  "6m": 6,
  "12m": 12
};

const CustomTooltip = ({ active, payload, label }: {active?: boolean; payload?: Array<{value: number; dataKey: string}>; label?: string}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong p-3 rounded-xl shadow-soft">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-medium text-text-primary">
            {entry.dataKey === "revenue" ? "Revenue" : entry.dataKey === "expenses" ? "Expenses" : "Net"}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data && data.length ? data : revenueData;
  const [range, setRange] = useState<RevenueRange>("12m");
  const [showRevenue, setShowRevenue] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showNet, setShowNet] = useState(false);

  const filteredData = useMemo(
    () => chartData.slice(-rangeConfig[range]).map((row) => ({ ...row, net: row.revenue - row.expenses })),
    [chartData, range]
  );

  return (
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Revenue Overview
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Monthly revenue vs expenses
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["6m", "12m"] as RevenueRange[]).map((windowKey) => (
            <button
              key={windowKey}
              type="button"
              onClick={() => setRange(windowKey)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                range === windowKey
                  ? "border-accent-orange/40 bg-accent-orange/10 text-white"
                  : "border-glass-border text-text-muted hover:text-white"
              }`}
            >
              {windowKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowRevenue((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
            showRevenue
              ? "border-accent-orange/40 bg-accent-orange/10 text-white"
              : "border-glass-border text-text-muted"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-accent-orange" />
          Revenue
        </button>
        <button
          type="button"
          onClick={() => setShowExpenses((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
            showExpenses
              ? "border-white/20 bg-white/10 text-white"
              : "border-glass-border text-text-muted"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setShowNet((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
            showNet
              ? "border-accent-green/40 bg-accent-green/10 text-white"
              : "border-glass-border text-text-muted"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-accent-green" />
          Net
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart className="revenue-overview-chart" data={filteredData} margin={{ top: 10, right: 18, left: 18, bottom: 52 }}>
            <defs>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF7A00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="whiteGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgba(255,255,255,0.2)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="rgba(255,255,255,0)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              height={44}
              padding={{ left: 20, right: 20 }}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, dy: 4 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF7A00"
              strokeWidth={2}
              fill="url(#orangeGradient)"
              hide={!showRevenue}
              isAnimationActive
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
              fill="url(#whiteGradient)"
              hide={!showExpenses}
              isAnimationActive
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#22C55E"
              strokeWidth={1.8}
              fill="rgba(34,197,94,0.06)"
              hide={!showNet}
              isAnimationActive
              animationDuration={600}
            />

            {filteredData.length > 5 && (
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
    </GlassCard>
  );
}
