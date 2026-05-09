"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppRole } from "@/lib/contracts";
import { setActiveUserEmail } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { getDisplayName } from "@/lib/utils";

function toAppRole(role?: string): AppRole {
  const normalized = (role ?? "viewer").toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "accountant") return "accountant";
  return "viewer";
}

function SessionBridge() {
  const { data: session, status } = useSession();
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setActiveUserEmail(null);
      setUser(null);
      return;
    }

    setActiveUserEmail(session.user.email ?? null);

    setUser({
      id: session.user.id,
      name: getDisplayName(session.user.name, session.user.email),
      email: session.user.email ?? "",
      role: toAppRole(session.user.role),
      avatar: session.user.image ?? undefined,
    });
  }, [session, setUser, status]);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionBridge />
      {children}
    </SessionProvider>
  );
}
