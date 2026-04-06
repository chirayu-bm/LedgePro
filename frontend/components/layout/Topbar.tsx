"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import {
  fetchWorkspaces,
  getActiveTenantSlug,
  setActiveTenantSlug,
  type WorkspaceSummary
} from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = "Dashboard" }: TopbarProps) {
  const router = useRouter();
  const { user, transactions, setTransactionSearchQuery, setUserRole } = useAppStore();
  const displayUserName = user?.name?.trim() || "User";
  const [query, setQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [activeWorkspaceSlug, setActiveWorkspaceSlugState] = useState(() => getActiveTenantSlug());
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.slug === activeWorkspaceSlug) ?? null,
    [activeWorkspaceSlug, workspaces]
  );

  const notifications = useMemo(() => {
    const latestTransactions = transactions.slice(0, 3).map((tx) => ({
      id: tx.id,
      title: tx.type === "credit" ? "Income posted" : "Expense posted",
      detail: `${tx.description} · ${tx.category}`,
      href: "/transactions"
    }));

    if (latestTransactions.length) {
      return latestTransactions;
    }

    return [
      {
        id: "system-1",
        title: "Workspace ready",
        detail: "Your dashboard is connected to backend services.",
        href: "/dashboard"
      },
      {
        id: "system-2",
        title: "Create your first invoice",
        detail: "Start billing from the invoices page.",
        href: "/invoices"
      }
    ];
  }, [transactions]);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (notificationRef.current && !notificationRef.current.contains(targetNode)) {
        setNotificationOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(targetNode)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setWorkspaces([]);
      return;
    }

    let cancelled = false;

    const loadWorkspaces = async () => {
      setWorkspaceLoading(true);
      try {
        const available = await fetchWorkspaces(user.role);
        if (cancelled) return;

        const storedSlug = getActiveTenantSlug();
        const resolvedSlug = available.some((workspace) => workspace.slug === storedSlug)
          ? storedSlug
          : available[0]?.slug ?? storedSlug;

        setWorkspaces(available);
        setActiveWorkspaceSlugState(resolvedSlug);
        setActiveTenantSlug(resolvedSlug);

        const activeMembership = available.find((workspace) => workspace.slug === resolvedSlug);
        if (activeMembership && user.role !== activeMembership.role) {
          setUserRole(activeMembership.role);
        }
      } catch {
        if (!cancelled) {
          setWorkspaces([]);
        }
      } finally {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      }
    };

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [setUserRole, user?.email, user?.role]);

  const runTransactionSearch = () => {
    const normalized = query.trim();
    if (!normalized) return;

    setTransactionSearchQuery(normalized);
    setQuery("");
    router.push("/transactions");
  };

  const onSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runTransactionSearch();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const handleWorkspaceChange = (nextSlug: string) => {
    setActiveTenantSlug(nextSlug);
    setActiveWorkspaceSlugState(nextSlug);

    const membership = workspaces.find((workspace) => workspace.slug === nextSlug);
    if (membership) {
      setUserRole(membership.role);
    }

    window.location.reload();
  };

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
          <div className="hidden sm:block">
            <form
              onSubmit={onSubmitSearch}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <Search size={13} className="text-text-muted" />
              <input
                type="text"
                value={query}
                placeholder="Search transactions"
                onChange={(event) => setQuery(event.target.value)}
                className="w-28 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none lg:w-36"
              />
            </form>
          </div>

          <div ref={notificationRef} className="relative">
            <button
              onClick={() => {
                setNotificationOpen((prev) => !prev);
                setProfileOpen(false);
                setUnreadCount(0);
              }}
              className="relative rounded-xl p-2 transition-colors hover:bg-white/[0.06] cursor-pointer"
            >
              <Bell size={18} className="text-text-secondary" />
              {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-orange" />}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-xl border border-white/10 bg-[#121621]/95 p-2 shadow-2xl backdrop-blur-xl">
                <p className="px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-text-muted">Notifications</p>
                <div className="mt-1 space-y-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        router.push(notification.href);
                        setNotificationOpen(false);
                      }}
                      className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <p className="text-sm text-text-primary">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{notification.detail}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotificationOpen(false);
              }}
              className="flex items-center gap-2 border-l border-white/10 pl-2 sm:pl-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-accent-orange/50">
                <User size={14} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none text-text-primary">
                  {displayUserName}
                </p>
                <p className="mt-0.5 text-xs capitalize text-text-muted">{user?.role ?? "viewer"}</p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 rounded-xl border border-white/10 bg-[#121621]/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Workspace</p>
                  <select
                    value={activeWorkspaceSlug}
                    onChange={(event) => handleWorkspaceChange(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-text-primary outline-none focus:border-accent-orange/60"
                  >
                    {workspaceLoading && !workspaces.length && <option value={activeWorkspaceSlug}>Loading...</option>}
                    {!workspaceLoading && !workspaces.length && (
                      <option value={activeWorkspaceSlug}>{activeWorkspaceSlug || "demo-sme"}</option>
                    )}
                    {workspaces.map((workspace) => (
                      <option key={workspace.tenantId} value={workspace.slug}>
                        {workspace.name} ({workspace.role})
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-text-muted">
                    {activeWorkspace?.name ?? "Active workspace"} · {activeWorkspace?.baseCurrency ?? "USD"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings size={15} />
                  Profile Settings
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
                >
                  <LogOut size={15} />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
