"use client";

import { Bell, Search, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = "Dashboard" }: TopbarProps) {
  const { user } = useAppStore();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16 flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 border-b border-glass-border glass-strong shadow-soft"
      )}
    >
      {/* Left */}
      <h1 className="min-w-0 flex-1 truncate text-base sm:text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
        {title}
      </h1>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-glass border border-glass-border rounded-xl px-4 py-2">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted w-40"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <Bell size={18} className="text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-orange rounded-full" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-glass-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange to-accent-orange/50 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary leading-none">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-text-muted mt-0.5 capitalize">
              {user?.role ?? "viewer"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
