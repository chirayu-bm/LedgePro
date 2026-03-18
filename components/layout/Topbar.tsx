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
        "sticky top-0 z-30 border-b border-white/10 bg-[#0c0f14]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8"
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white sm:text-base">{title}</p>
          <p className="hidden text-[11px] uppercase tracking-[0.16em] text-text-muted sm:block">LedgerFlow workspace</p>
        </div>

        <div className="hidden justify-center lg:flex">
          <div className="flex items-center justify-center rounded-full border border-white/10 bg-[#0a0d12] px-4 py-2 text-xs text-text-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
            <span className="leading-none">secure.ledgerflow.app</span>
            <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">live</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex">
            <Search size={13} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search"
              className="w-28 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none lg:w-36"
            />
          </div>

          <button className="relative rounded-xl p-2 transition-colors hover:bg-white/[0.06] cursor-pointer">
            <Bell size={18} className="text-text-secondary" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-orange" />
          </button>

          <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-accent-orange/50">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none text-text-primary">
              {user?.name ?? "User"}
              </p>
              <p className="mt-0.5 text-xs capitalize text-text-muted">{user?.role ?? "viewer"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
