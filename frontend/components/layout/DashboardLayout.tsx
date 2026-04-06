"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageWrapper from "./PageWrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({
  children,
  title,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-bg-main overflow-x-clip">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 relative z-0">
        <Topbar title={title} />
        <PageWrapper>{children}</PageWrapper>
      </div>
    </div>
  );
}
