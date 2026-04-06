"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-8"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/20 via-accent-orange/5 to-transparent" />
      <div className="absolute inset-0 glass" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-orange/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-text-secondary text-sm mb-2">
              Welcome back, Alex 👋
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-space-grotesk)] leading-tight">
              Financial Overview
            </h2>
            <p className="text-text-muted text-sm mt-3">
              Here&apos;s what&apos;s happening with your finances today.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {formatCurrency(284500)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={14} className="text-accent-green" />
                <span className="text-xs text-accent-green font-medium">
                  +12.5% from last month
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-orange text-white font-medium text-sm shadow-glow-orange cursor-pointer"
            >
              View Report
              <ArrowUpRight size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
