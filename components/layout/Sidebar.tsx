"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 240 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex sticky top-0 h-screen shrink-0 flex-col z-40 glass-strong border-r border-glass-border shadow-soft"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-glass-border/70">
          <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-sm whitespace-nowrap overflow-hidden font-[family-name:var(--font-space-grotesk)]"
              >
                LedgerFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 3, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 group relative border overflow-hidden",
                    isActive
                      ? "text-white border-accent-orange/35 bg-gradient-to-r from-accent-orange/20 via-accent-orange/10 to-transparent shadow-[0_12px_28px_rgba(255,122,0,0.18)]"
                      : "border-transparent text-text-secondary hover:text-white hover:border-white/12 hover:bg-white/[0.06]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent-orange shadow-glow-orange"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      isActive ? "bg-accent-orange/20" : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn(
                        isActive
                          ? "text-accent-orange drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]"
                          : "text-text-secondary group-hover:text-white"
                      )}
                    />
                  </div>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium leading-6 whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="mx-3 mb-4 px-3 py-2 rounded-xl border border-transparent hover:border-white/12 hover:bg-white/[0.06] transition-colors text-text-muted hover:text-white cursor-pointer"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft size={18} />
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </button>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-glass-border">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                    isActive
                      ? "text-accent-orange"
                      : "text-text-muted"
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
