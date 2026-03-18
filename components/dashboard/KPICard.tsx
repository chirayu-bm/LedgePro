"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  trend: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  index?: number;
}

export default function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  isCurrency = true,
  index = 0,
}: KPICardProps) {
  const isPositive = trend >= 0;

  return (
    <GlassCard
      hover
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="p-2.5 rounded-xl bg-accent-orange/10">
          <Icon size={20} className="text-accent-orange" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            isPositive
              ? "bg-accent-green/10 text-accent-green"
              : "bg-accent-red/10 text-accent-red"
          )}
        >
          {isPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          {isPositive ? "+" : ""}
          {trend}%
        </div>
      </div>

      <p className="text-2xl font-bold text-text-primary mb-1">
        {isCurrency ? formatCurrency(value) : formatNumber(value)}
      </p>
      <p className="text-sm text-text-muted">{title}</p>
    </GlassCard>
  );
}
