"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { revenueData } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: {active?: boolean; payload?: Array<{value: number; dataKey: string}>; label?: string}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong p-3 rounded-xl shadow-soft">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-medium text-text-primary">
            {entry.dataKey === "revenue" ? "Revenue" : "Expenses"}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
            <span className="text-xs text-text-muted">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="text-xs text-text-muted">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
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
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
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
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
              fill="url(#whiteGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
