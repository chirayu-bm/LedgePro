import Link from "next/link";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Transactions", href: "/transactions" },
      { label: "Invoices", href: "/invoices" },
      { label: "Reports", href: "/reports" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Analytics", href: "/analytics" },
      { label: "Automation", href: "/dashboard" },
      { label: "Compliance", href: "/reports" },
      { label: "Data Exports", href: "/transactions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Security", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Contact", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/" },
      { label: "Terms of Service", href: "/" },
      { label: "Cookie Policy", href: "/" },
      { label: "Risk Disclosure", href: "/" },
    ],
  },
];

export default function PremiumFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-glass-border/70 bg-bg-main pt-10 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -top-24 left-1/2 h-48 w-[70rem] -translate-x-1/2 rounded-full bg-accent-orange/10 blur-3xl" />
        <div className="absolute -bottom-32 right-[-10%] h-56 w-56 rounded-full bg-accent-orange/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-y border-glass-border/50 py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <p className="max-w-3xl leading-relaxed">
            LedgerFlow is a workflow and analytics operating layer for modern finance teams. Information presented in the product is for planning and operations support, and should be validated by your team before execution.
          </p>
          <div className="flex items-center gap-2 text-text-secondary">
            <span>Powered by</span>
            <span className="font-heading text-sm font-semibold tracking-wide text-white">Ledger Intelligence</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:gap-12">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-orange shadow-glow-orange">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-heading text-3xl font-semibold tracking-tight text-white">LedgerFlow</span>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-text-secondary">
              Precision financial operations with live visibility across transactions, reconciliation, invoicing, and reporting.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="glass flex h-11 w-11 items-center justify-center rounded-full border-glass-border/70 text-text-secondary">
                <ShieldCheck size={18} />
              </div>
              <div className="glass flex h-11 w-11 items-center justify-center rounded-full border-glass-border/70 text-text-secondary">
                <BadgeCheck size={18} />
              </div>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/90 transition-colors duration-200 hover:text-accent-orange"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-glass-border/50 py-6 text-xs text-text-muted sm:text-sm">
          <p>© 2026 LedgerFlow Technologies. All rights reserved.</p>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap px-4 pb-3 text-center font-heading text-[min(24vw,19rem)] font-semibold leading-none tracking-[-0.05em] text-white/[0.05]"
      >
        ledgerflow
      </div>
    </footer>
  );
}
